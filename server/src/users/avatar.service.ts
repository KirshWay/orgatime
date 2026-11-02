import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import type { MultipartRequestLike } from 'src/common/http/http.types';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  async getContent(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    const match = user?.avatar?.match(
      /^\/uploads\/avatars\/(?:([a-zA-Z0-9_-]+)\/)?([a-zA-Z0-9_-]+\.(?:webp|gif|png|jpe?g))$/i,
    );
    if (!match || (match[1] && match[1] !== userId)) {
      throw new NotFoundException('Avatar not found');
    }
    const path = join(
      process.cwd(),
      'uploads',
      'avatars',
      match[1] ?? '',
      match[2],
    );
    try {
      const buffer = await readFile(path);
      const metadata = await sharp(buffer).metadata();
      const types: Record<string, string> = {
        webp: 'image/webp',
        gif: 'image/gif',
        png: 'image/png',
        jpeg: 'image/jpeg',
      };
      const type = types[metadata.format ?? ''];
      if (!type) throw new Error('Unsupported avatar');
      return { buffer, type };
    } catch {
      throw new NotFoundException('Avatar not found');
    }
  }

  async upload(userId: string, request: MultipartRequestLike) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!/^[a-zA-Z0-9_-]+$/.test(userId))
      throw new NotFoundException('User not found');
    const result = await this.imageUploadService.uploadAvatar(request, userId);
    try {
      const updated = await this.prisma.user.updateMany({
        where: { id: userId, avatar: user.avatar },
        data: { avatar: result.avatarUrl },
      });
      if (updated.count !== 1)
        throw new ConflictException('Avatar changed. Please retry.');
    } catch (error) {
      await this.removeOwnedAvatar(userId, result.avatarUrl);
      throw error;
    }
    await this.removeOwnedAvatar(userId, user.avatar);
    return result;
  }

  private async removeOwnedAvatar(userId: string, avatar: string | null) {
    const prefix = `/uploads/avatars/${userId}/`;
    if (!avatar?.startsWith(prefix)) return;
    const filename = avatar.slice(prefix.length);
    if (!/^[a-f0-9-]+\.(?:webp|gif)$/.test(filename)) return;
    try {
      await unlink(join(process.cwd(), 'uploads', 'avatars', userId, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn('Unable to remove old avatar file');
      }
    }
  }
}
