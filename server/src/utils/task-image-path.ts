import { NotFoundException } from '@nestjs/common';
import { join } from 'path';

const TASK_IMAGE_NAME = /^[a-zA-Z0-9_-]+\.(?:webp|gif|png|jpe?g)$/i;

export function resolveTaskImagePath(
  image: { filename: string; path: string },
  directory = join(process.cwd(), 'uploads', 'tasks'),
): string {
  if (
    !TASK_IMAGE_NAME.test(image.filename) ||
    image.path !== `/uploads/tasks/${image.filename}`
  ) {
    throw new NotFoundException('Image not found');
  }
  return join(directory, image.filename);
}
