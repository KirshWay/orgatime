import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { expect, test } from 'vitest';
import { createStaticAssetOptions } from 'src/common/http/fastify-options';

test('retains the existing single-hop proxy behavior', async (t) => {
  const app = fastify({ trustProxy: 1 });
  t.onTestFinished(() => app.close());
  app.get('/identity', (request) => ({
    ip: request.ip,
    hostname: request.hostname,
    protocol: request.protocol,
  }));
  const response = await app.inject({
    url: '/identity',
    remoteAddress: '10.0.0.2',
    headers: {
      host: 'orgatime.test',
      'x-forwarded-for': '198.51.100.99, 192.168.1.20',
      'x-forwarded-host': 'forwarded.test',
      'x-forwarded-proto': 'https',
    },
  });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({
    ip: '192.168.1.20',
    hostname: 'forwarded.test',
    protocol: 'https',
  });
  expect(app.server.listening).toBe(false);
});

test('static uploads keep GET/HEAD, cache headers and path containment', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'orgatime-static-'));
  const root = join(directory, 'uploads');
  await mkdir(root);
  await writeFile(join(root, 'image.txt'), 'fixture image');
  await writeFile(join(directory, 'outside.txt'), 'outside fixture');
  const app = fastify();
  t.onTestFinished(async () => {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  });
  await app.register(fastifyStatic, createStaticAssetOptions(root));

  for (const method of ['GET', 'HEAD'] as const) {
    const response = await app.inject({ method, url: '/uploads/image.txt' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe(
      'public, max-age=604800, immutable',
    );
    expect(response.headers.vary).toBe('Accept-Encoding');
    expect(response.headers['content-type']).toMatch(/^text\/plain/);
    expect(Date.parse(String(response.headers.expires))).toBeGreaterThan(
      Date.now(),
    );
    expect(response.body).toBe(method === 'GET' ? 'fixture image' : '');
  }

  for (const url of [
    '/uploads/missing.txt',
    '/uploads/%2e%2e/outside.txt',
    '/uploads/a/../../outside.txt',
  ]) {
    const response = await app.inject({ url });
    expect(response.statusCode).not.toBe(200);
    expect(response.body).not.toContain('outside fixture');
  }
  expect(app.server.listening).toBe(false);
});
