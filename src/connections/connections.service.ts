import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection } from './entities/connection.entity';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { Provider } from '../common/enums/provider.enum';
import { OAuthService } from '../oauth/oauth.service'; // Assuming an OAuth service exists
import { EncryptionService } from '../encryption/encryption.service'; // Assuming an encryption service exists

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectRepository(Connection)
    private connectionsRepository: Repository<Connection>,
    private oauthService: OAuthService, // For OAuth providers
    private encryptionService: EncryptionService, // For encrypting sensitive data
  ) {}

  async create(createConnectionDto: CreateConnectionDto): Promise<Connection> {
    const { provider, organizationId, code, redirectUri, apiKey } = createConnectionDto;

    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresAt: Date | null = null;

    switch (provider) {
      case Provider.WORKABLE:
        if (!apiKey) {
          throw new BadRequestException('API key is required for Workable connections.');
        }
        accessToken = apiKey;
        // Workable API keys are long-lived and don't typically expire or refresh
        // Set expiresAt to a very distant future date or leave null if your schema allows
        // For simplicity, we'll leave refresh_token and expires_at null for now.
        // If your DB schema requires a date, consider setting it far in the future.
        break;

      // Handle existing OAuth providers
      case Provider.GOOGLE:
      case Provider.SLACK:
      case Provider.HUBSPOT:
      case Provider.SALESFORCE:
      // ... other OAuth providers
        if (!code || !redirectUri) {
          throw new BadRequestException('Authorization code and redirect URI are required for OAuth connections.');
        }
        try {
          const oauthTokens = await this.oauthService.exchangeCodeForTokens(
            provider,
            code,
            redirectUri,
          );
          accessToken = oauthTokens.accessToken;
          refreshToken = oauthTokens.refreshToken || null;
          expiresAt = oauthTokens.expiresIn
            ? new Date(Date.now() + oauthTokens.expiresIn * 1000)
            : null;
        } catch (error) {
          this.logger.error(`Failed to exchange code for tokens for ${provider}: ${error.message}`);
          throw new BadRequestException(`Failed to establish OAuth connection: ${error.message}`);
        }
        break;

      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    // Encrypt sensitive tokens before saving
    const encryptedAccessToken = await this.encryptionService.encrypt(accessToken);
    const encryptedRefreshToken = refreshToken
      ? await this.encryptionService.encrypt(refreshToken)
      : null;

    const newConnection = this.connectionsRepository.create({
      organizationId,
      provider,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      // Other fields like scope, state, etc. can be added if needed
    });

    return this.connectionsRepository.save(newConnection);
  }

  async findOne(id: string): Promise<Connection> {
    const connection = await this.connectionsRepository.findOne({ where: { id } });
    if (!connection) {
      throw new BadRequestException(`Connection with ID ${id} not found.`);
    }
    // Decrypt access token before returning, if needed by downstream services
    // For this bounty, we're focusing on storage, decryption would be in a separate
    // service that consumes the connection.
    // connection.accessToken = await this.encryptionService.decrypt(connection.accessToken);
    return connection;
  }

  async findAllByOrganization(organizationId: string): Promise<Connection[]> {
    return this.connectionsRepository.find({ where: { organizationId } });
  }

  async remove(id: string): Promise<void> {
    const result = await this.connectionsRepository.delete(id);
    if (result.affected === 0) {
      throw new BadRequestException(`Connection with ID ${id} not found.`);
    }
  }
}
