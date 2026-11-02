import { Injectable } from '@nestjs/common';
import { join } from 'path';
import type { MultipartRequestLike } from '../http/http.types';
import { getMultipartImageFile } from '../http/multipart.utils';
import { convertToWebp } from 'src/utils/file-upload.utils';

@Injectable()
export class ImageUploadService {
  async uploadAvatar(request: MultipartRequestLike, userId: string) {
    const file = await getMultipartImageFile(
      request,
      'avatar',
      5 * 1024 * 1024,
    );
    const destination = join(process.cwd(), 'uploads', 'avatars', userId);
    const { path: avatarUrl } = await convertToWebp(file, destination);
    return { avatarUrl };
  }

  async uploadTaskImage(request: MultipartRequestLike) {
    const file = await getMultipartImageFile(
      request,
      'image',
      10 * 1024 * 1024,
    );
    return convertToWebp(file, join(process.cwd(), 'uploads', 'tasks'));
  }
}
