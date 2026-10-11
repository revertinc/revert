import { IsEnum, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { Provider } from '../../common/enums/provider.enum';

export class CreateConnectionDto {
  @IsEnum(Provider)
  provider: Provider;

  @IsUUID()
  organizationId: string;

  @IsString()
  @IsOptional()
  code?: string; // For OAuth authorization code flow

  @IsString()
  @IsOptional()
  redirectUri?: string; // For OAuth authorization code flow

  @IsString()
  @IsOptional()
  scope?: string; // For OAuth authorization code flow

  @IsString()
  @IsOptional()
  state?: string; // For OAuth authorization code flow

  // New field for direct API key input (e.g., Workable)
  @IsString()
  @IsOptional()
  apiKey?: string; // For providers that use a static API key
}
