import fastify from 'fastify';
import { expect, onTestFinished, test } from 'vitest';

const trustedProxyCidrs = '10.0.4.0/24,10.0.2.0/24';

function createApp(trustProxy: string | false = trustedProxyCidrs) {
  const app = fastify({ trustProxy });
  onTestFinished(() => app.close());
  app.get('/identity', (request) => ({
    ip: request.ip,
    hostname: request.hostname,
    protocol: request.protocol,
  }));
  return app;
}

test.each(['10.0.4.12', '::ffff:10.0.4.12'])(
  'resolves distinct visitors through Caddy and nginx from %s',
  async (remoteAddress) => {
    const app = createApp();
    for (const visitor of ['198.51.100.20', '203.0.113.30']) {
      const response = await app.inject({
        url: '/identity',
        remoteAddress,
        headers: {
          host: 'orgatime.test',
          'x-forwarded-for': `${visitor}, 10.0.2.8`,
        },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().ip).toBe(visitor);
    }
    expect(app.server.listening).toBe(false);
  },
);

test.each([
  '198.51.100.1',
  '2001:db8::1',
  '10.0.5.2',
  '192.168.1.2',
  '127.0.0.1',
])(
  'ignores forwarded headers from untrusted peer %s',
  async (remoteAddress) => {
    const app = createApp();
    const response = await app.inject({
      url: '/identity',
      remoteAddress,
      headers: {
        host: 'orgatime.test',
        'x-forwarded-for': '198.51.100.99, 10.0.2.8',
        'x-forwarded-host': 'spoofed.test',
        'x-forwarded-proto': 'https',
      },
    });
    expect(response.json()).toEqual({
      ip: remoteAddress,
      hostname: 'orgatime.test',
      protocol: 'http',
    });
  },
);

test('stops at an untrusted intermediate proxy instead of accepting its claimed visitor', async () => {
  const app = createApp();
  const response = await app.inject({
    url: '/identity',
    remoteAddress: '10.0.4.12',
    headers: { 'x-forwarded-for': '198.51.100.99, 10.0.5.8' },
  });
  expect(response.json().ip).toBe('10.0.5.8');
});

test('does not follow forged entries beyond the first untrusted client', async () => {
  const app = createApp();
  const response = await app.inject({
    url: '/identity',
    remoteAddress: '10.0.4.12',
    headers: { 'x-forwarded-for': '192.0.2.99, 198.51.100.20, 10.0.2.8' },
  });
  expect(response.json().ip).toBe('198.51.100.20');
});

test('local development without proxy trust ignores forwarded IPs', async () => {
  const app = createApp(false);
  const response = await app.inject({
    url: '/identity',
    remoteAddress: '127.0.0.1',
    headers: { 'x-forwarded-for': '198.51.100.20' },
  });
  expect(response.json().ip).toBe('127.0.0.1');
});

test('rejects an invalid proxy range during initialization', () => {
  expect(() => fastify({ trustProxy: 'invalid-network' })).toThrow();
});
