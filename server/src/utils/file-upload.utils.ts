import { BadRequestException } from '@nestjs/common';
import type { UploadedImageFile } from 'src/common/http/multipart.utils';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, relative, sep } from 'path';
import sharp, { type Metadata } from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export const convertToWebp = async (
  file: UploadedImageFile,
  destination: string,
): Promise<{ filename: string; path: string }> => {
  await mkdir(destination, { recursive: true });
  let metadata: Metadata;
  try {
    metadata = await sharp(file.buffer, { animated: true }).metadata();
  } catch {
    throw new BadRequestException('File is not a valid image');
  }
  if (
    !metadata.width ||
    !metadata.height ||
    !['gif', 'jpeg', 'png', 'webp'].includes(metadata.format ?? '')
  ) {
    throw new BadRequestException('File is not a supported image');
  }
  const isGif = metadata.format === 'gif';
  const filename = `${uuidv4()}.${isGif ? 'gif' : 'webp'}`;
  const outputPath = join(destination, filename);
  try {
    if (isGif) {
      await writeFile(outputPath, file.buffer, { flag: 'wx' });
    } else {
      await sharp(file.buffer)
        .webp({ quality: 85, effort: 4 })
        .toFile(outputPath);
    }
  } catch (error) {
    await unlink(outputPath).catch(() => undefined);
    throw error;
  }
  const uploadSegments = destination.split(sep);
  const uploadsIndex = uploadSegments.lastIndexOf('uploads');
  const publicDirectory = uploadSegments.slice(uploadsIndex + 1).join('/');
  if (uploadsIndex < 0 || relative(destination, outputPath).startsWith('..')) {
    await unlink(outputPath).catch(() => undefined);
    throw new Error('Invalid image destination');
  }
  return { filename, path: `/uploads/${publicDirectory}/${filename}` };
};
