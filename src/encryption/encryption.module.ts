import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Module({
  providers: [EncryptionService],
  exports: [EncryptionService], // Export to be used by other modules
})
export class EncryptionModule {}
