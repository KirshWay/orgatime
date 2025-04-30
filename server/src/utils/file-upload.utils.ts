import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { promisify } from 'util';
import { join } from 'path';
import * as sharp from 'sharp';

const writeFileAsync = promisify(writeFile);

export const editFileName = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
): void => {
  const name = uuidv4();
  const fileExtName = '.webp';
  callback(null, `${name}${fileExtName}`);
};

export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }

  callback(null, true);
};

export const convertToWebp = async (
  file: Express.Multer.File,
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
