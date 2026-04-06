import type { UploadedImageFile } from 'src/common/http/multipart.utils';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';
import * as sharp from 'sharp';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFileAsync = promisify(writeFile);

export const convertToWebp = async (
  file: UploadedImageFile,
  destination: string,
): Promise<{ filename: string; path: string }> => {
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  const isGif = file.mimetype === 'image/gif';
  let filename: string;
  let outputPath: string;

  if (isGif) {
    filename = `${uuidv4()}.gif`;
    outputPath = join(destination, filename);

    await writeFileAsync(outputPath, file.buffer);
  } else {
    filename = `${uuidv4()}.webp`;
    outputPath = join(destination, filename);

    await sharp(file.buffer)
      .webp({ quality: 85, effort: 4 })
      .toFile(outputPath);
  }

  const pathForApi = outputPath.split('uploads')[1].replace(/\\/g, '/');

  return {
    filename,
    path: `/uploads${pathForApi}`,
  };
};
