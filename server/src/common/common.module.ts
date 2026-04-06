import { Module } from '@nestjs/common';
import { ImageUploadService } from './services/image-upload.service';
import { RefreshTokenCookieService } from './services/refresh-token-cookie.service';

@Module({
  providers: [RefreshTokenCookieService, ImageUploadService],
  exports: [RefreshTokenCookieService, ImageUploadService],
})
export class CommonModule {}
