import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { join } from 'path';
import { unlink } from 'fs/promises';
import type { MultipartRequestLike } from '../http/http.types';
import { getMultipartImageFile } from '../http/multipart.utils';
import { convertToWebp } from 'src/utils/file-upload.utils';

@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);

  async uploadAvatar(
    request: MultipartRequestLike,
    currentAvatar?: string,
  ): Promise<{ avatarUrl: string }> {
    const file = await getMultipartImageFile(request, 'avatar', 5 * 1024 * 1024);

    if (currentAvatar) {
      await this.removeAvatar(currentAvatar);
    }

    const destination = join(process.cwd(), 'uploads', 'avatars');
    const { path: avatarUrl } = await convertToWebp(file, destination);

    return { avatarUrl };
  }

  async uploadTaskImage(
    request: MultipartRequestLike,
  ): Promise<{ filename: string; path: string }> {
    const file = await getMultipartImageFile(request, 'image', 10 * 1024 * 1024);
    const destination = join(process.cwd(), 'uploads', 'tasks');

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Image processing timeout')), 30000);
      });

      return await Promise.race([
        convertToWebp(file, destination),
        timeoutPromise,
      ]);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Image processing timeout'
      ) {
        throw new RequestTimeoutException(
          'Image processing timeout. Please try reducing the file size or uploading another image.',
        );
      }

      this.logger.error(
        'Error processing task image',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Error processing image.');
    }
  }

  private async removeAvatar(currentAvatar: string): Promise<void> {
    const parts = currentAvatar.split('/');
    const filename = parts[parts.length - 1];
    const avatarPath = join(process.cwd(), 'uploads', 'avatars', filename);

    try {
      await unlink(avatarPath);
    } catch (error) {
      this.logger.warn(
        `Failed to delete old avatar: ${avatarPath} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
