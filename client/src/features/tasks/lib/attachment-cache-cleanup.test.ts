import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test, vi } from 'vitest';

test('worker activation removes only private legacy upload entries from the two historical caches', async () => {
  const source = readFileSync('public/attachment-cache-cleanup.js', 'utf8');
  const requests = [
    '/uploads/tasks/old.gif',
    '/uploads/tasks/old.webp?x=1',
    '/uploads/avatars/public.webp',
    '/assets/index.js',
    '/',
    '/uploads/tasks-lookalike/image.png',
  ].map((path) => ({ url: `https://orgatime.test${path}` }));
  const deletions: Record<string, string[]> = {};
  let activate!: (event: {
    waitUntil: (promise: Promise<unknown>) => void;
  }) => void;
  const open = vi.fn(async (name: string) => ({
    keys: async () => requests,
    delete: async (request: { url: string }) => {
      (deletions[name] ??= []).push(request.url);
      return true;
    },
  }));
  runInNewContext(source, {
    self: {
      addEventListener: (event: string, handler: typeof activate) => {
        expect(event).toBe('activate');
        activate = handler;
      },
    },
    caches: {
      keys: async () => ['static-assets', 'html-cache', 'other-app-cache'],
      open,
    },
    URL,
  });
  let cleanup!: Promise<unknown>;
  activate({
    waitUntil: (promise) => {
      cleanup = promise;
    },
  });
  await cleanup;
  expect(open.mock.calls.flat()).toEqual(['static-assets', 'html-cache']);
  const privateUrls = requests.slice(0, 3).map((request) => request.url);
  expect(deletions).toEqual({
    'static-assets': privateUrls,
    'html-cache': privateUrls,
  });
});
