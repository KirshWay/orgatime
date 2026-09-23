import { Controller, Get, Module, Req, UseGuards } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { afterEach, expect, test, vi } from 'vitest';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { getJwtSecret } from 'src/auth/jwt-config';

// Only the database boundary is replaced. No real configuration files,
// database connections or listening server ports are used by these tests.
vi.mock('src/prisma/prisma.service', () => ({
  PrismaService: class {
    user = {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === 'test-user' ? { id: 'test-user' } : null,
    };
  },
}));

let app: NestFastifyApplication | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

test.each([undefined, ''])(
  'missing configuration still fails instead of using a fallback key (%s)',
  (secret) => {
    vi.stubEnv('JWT_SECRET', undefined);
    const config = new ConfigService({ JWT_SECRET: secret });
    expect(() => getJwtSecret(config)).toThrow('JWT_SECRET is not set');
  },
);

test('auth imports before configuration is loaded, then verifies tokens using the configured key', async () => {
  vi.stubEnv('JWT_SECRET', undefined);
  const loaded = import('src/auth/auth.module');
  await expect(loaded).resolves.toHaveProperty('AuthModule');
  const { AuthModule } = await loaded;

  @Controller('protected')
  class ProtectedController {
    @Get()
    @UseGuards(JwtAuthGuard)
    read(@Req() request: { user: { id: string } }) {
      return request.user;
    }
  }
  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        ignoreEnvVars: true,
        skipProcessEnv: true,
        load: [() => ({ JWT_SECRET: 'public-test-fixture-key' })],
      }),
      AuthModule,
    ],
    controllers: [ProtectedController],
  })
  class TestModule {}
  app = await NestFactory.create<NestFastifyApplication>(
    TestModule,
    new FastifyAdapter(),
    { logger: false, abortOnError: false },
  );
  await app.init();
  const jwt = app.get(JwtService);
  const valid = jwt.sign({ sub: 'test-user' });
  const response = await app.inject({
    method: 'GET',
    url: '/protected',
    headers: { authorization: `Bearer ${valid}` },
  });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ id: 'test-user' });

  for (const token of [
    undefined,
    new JwtService({ secret: 'different-test-key' }).sign({ sub: 'test-user' }),
    jwt.sign({ sub: 'test-user' }, { expiresIn: -1 }),
    jwt.sign({ sub: 'missing-user' }),
  ]) {
    const rejected = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    expect(rejected.statusCode).toBe(401);
  }
});
