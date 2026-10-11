// This is a placeholder for an existing EncryptionService.
// It would contain logic to encrypt and decrypt sensitive strings.

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer; // Initialization vector

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const encryptionIv = process.env.ENCRYPTION_IV;

    if (!encryptionKey || encryptionKey.length !== 32) { // 32 bytes for aes-256
      this.logger.error('ENCRYPTION_KEY environment variable is missing or invalid. It must be 32 characters long.');
      throw new InternalServerErrorException('Encryption key is not configured correctly.');
    }
    if (!encryptionIv || encryptionIv.length !== 16) { // 16 bytes for IV
      this.logger.error('ENCRYPTION_IV environment variable is missing or invalid. It must be 16 characters long.');
      throw new InternalServerErrorException('Encryption IV is not configured correctly.');
    }

    this.key = Buffer.from(encryptionKey, 'utf8');
    this.iv = Buffer.from(encryptionIv, 'utf8');
  }

  async encrypt(text: string): Promise<string> {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new InternalServerErrorException('Failed to encrypt data.');
    }
  }

  async decrypt(encryptedText: string): Promise<string> {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new InternalServerErrorException('Failed to decrypt data.');
    }
  }
}
