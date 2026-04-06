import {
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import type {
  MultipartFileLike,
  MultipartRequestLike,
} from './http.types';

export type UploadedImageFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

const IMAGE_FILE_NAME_PATTERN = /\.(jpg|jpeg|png|gif|webp)$/i;
const MULTIPART_LIMIT_ERROR_NAMES = new Set([
  'RequestFileTooLargeError',
  'FilesLimitError',
  'PartsLimitError',
]);

function isMultipartLimitError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    MULTIPART_LIMIT_ERROR_NAMES.has(error.name)
  );
}

export async function getMultipartImageFile(
  request: MultipartRequestLike,
  fieldName: string,
  maxFileSize: number,
): Promise<UploadedImageFile> {
  let file: MultipartFileLike | undefined;

  try {
    file = await request.file({
      limits: {
        files: 1,
        fileSize: maxFileSize,
      },
    });
  } catch (error) {
    if (isMultipartLimitError(error)) {
      throw new PayloadTooLargeException(`File exceeds ${maxFileSize} bytes`);
    }

    throw error;
  }

  if (!file || file.fieldname !== fieldName) {
    throw new BadRequestException('File is not an image');
  }

  if (!IMAGE_FILE_NAME_PATTERN.test(file.filename)) {
    throw new BadRequestException('File is not an image');
  }

  let buffer: Buffer;
  try {
    buffer = await file.toBuffer();
  } catch (error) {
    if (isMultipartLimitError(error)) {
      throw new PayloadTooLargeException(`File exceeds ${maxFileSize} bytes`);
    }

    throw error;
  }

  if (!file.mimetype.startsWith('image/')) {
    throw new BadRequestException('File is not an image');
  }

  return {
    originalname: file.filename,
    mimetype: file.mimetype,
    buffer,
    size: buffer.length,
  };
}
