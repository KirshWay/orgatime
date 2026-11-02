import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test, vi } from 'vitest';

vi.mock('sharp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sharp')>();
  return {
    default: (...args: Parameters<typeof actual.default>) => {
      const instance = actual.default(...args);
      Object.defineProperty(instance, 'toFile', {
        value: async (path: string) => {
          await writeFile(path, 'partial encoder output');
          throw new Error('encoder failed');
        },
      });
      return instance;
    },
  };
});
import { convertToWebp } from 'src/utils/file-upload.utils';

test('encoder failure removes even a partially written output file', async (t) => {
  const { default: sharp } =
    await vi.importActual<typeof import('sharp')>('sharp');
  const buffer = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#000' },
  })
    .png()
    .toBuffer();
  const directory = await mkdtemp(join(tmpdir(), 'orgatime-encoder-'));
  t.onTestFinished(() => rm(directory, { recursive: true, force: true }));
  const destination = join(directory, 'uploads', 'tasks');
  await expect(
    convertToWebp(
      {
        buffer,
        size: buffer.length,
        mimetype: 'image/png',
        originalname: 'image.png',
      },
      destination,
    ),
  ).rejects.toThrow('encoder failed');
  expect(await readdir(destination)).toEqual([]);
});
