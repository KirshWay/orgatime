import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { expect, test, type TestContext } from 'vitest';
import { convertToWebp } from 'src/utils/file-upload.utils';

async function destination(t: TestContext): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'orgatime-image-'));
  t.onTestFinished(() => rm(directory, { recursive: true, force: true }));
  return join(directory, 'uploads', 'tasks');
}

test('uploaded PNG becomes a readable WebP with the same dimensions and API path', async (t) => {
  const buffer = await sharp({
    create: { width: 3, height: 2, channels: 4, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  const outputDirectory = await destination(t);
  const result = await convertToWebp(
    {
      buffer,
      mimetype: 'image/png',
      originalname: 'image.png',
      size: buffer.length,
    },
    outputDirectory,
  );
  expect(result.filename).toMatch(/^[a-f0-9-]+\.webp$/);
  expect(result.path).toBe(`/uploads/tasks/${result.filename}`);
  const metadata = await sharp(
    await readFile(join(outputDirectory, result.filename)),
  ).metadata();
  expect(metadata.format).toBe('webp');
  expect(metadata.width).toBe(3);
  expect(metadata.height).toBe(2);
});

test('GIF uploads retain their original bytes and GIF URL', async (t) => {
  const buffer = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64',
  );
  const outputDirectory = await destination(t);
  const result = await convertToWebp(
    {
      buffer,
      mimetype: 'image/gif',
      originalname: 'image.gif',
      size: buffer.length,
    },
    outputDirectory,
  );
  expect(result.filename).toMatch(/\.gif$/);
  expect(result.path).toBe(`/uploads/tasks/${result.filename}`);
  expect(await readFile(join(outputDirectory, result.filename))).toEqual(
    buffer,
  );
});

test('invalid image data is rejected without leaving an output file', async (t) => {
  const outputDirectory = await destination(t);
  const buffer = Buffer.from('not an image');
  await expect(
    convertToWebp(
      {
        buffer,
        mimetype: 'image/png',
        originalname: 'image.png',
        size: buffer.length,
      },
      outputDirectory,
    ),
  ).rejects.toThrow();
  expect(await readdir(outputDirectory)).toEqual([]);
});
