import { Module } from '@nestjs/common';
import { OAuthService } from './oauth.service';

@Module({
  providers: [OAuthService],
  exports: [OAuthService], // Export to be used by other modules
})
export class OAuthModule {}
