import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ConnectionsModule } from './connections/connections.module';
import { Connection } from './connections/entities/connection.entity';
import { OAuthModule } from './oauth/oauth.module';
import { EncryptionModule } from './encryption/encryption.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available throughout the application
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [Connection], // Ensure Connection entity is listed
      synchronize: process.env.NODE_ENV !== 'production', // Set to false in production, use migrations
    }),
    ConnectionsModule,
    OAuthModule, // Ensure OAuthModule is imported
    EncryptionModule, // Ensure EncryptionModule is imported
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
