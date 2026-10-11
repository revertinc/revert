import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { Connection } from './entities/connection.entity';
import { OAuthModule } from '../oauth/oauth.module'; // Import OAuthModule
import { EncryptionModule } from '../encryption/encryption.module'; // Import EncryptionModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Connection]),
    OAuthModule, // Make OAuthService available
    EncryptionModule, // Make EncryptionService available
  ],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService], // Export if other modules need to use it
})
export class ConnectionsModule {}
