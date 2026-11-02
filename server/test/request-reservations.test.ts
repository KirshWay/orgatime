import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { afterEach, expect, test, vi } from 'vitest';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { RefreshTokenCookieService } from 'src/common/services/refresh-token-cookie.service';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import type { CookieReplyLike } from 'src/common/http/http.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { TasksService } from 'src/tasks/tasks.service';
import { UsersService } from 'src/users/users.service';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

async function expectRateLimit(operation: Promise<unknown>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Request was admitted and did not finish')),
      100,
    );
  });
  try {
    await expect(Promise.race([operation, deadline])).rejects.toMatchObject({
      status: 429,
    });
  } finally {
    clearTimeout(timer);
  }
}

const password = 'Password1!';
const user: User = {
  id: 'owner',
  email: 'user@example.com',
  username: 'user',
  avatar: null,
  password: bcrypt.hashSync(password, 4),
  refreshToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  createdAt: new Date(),
};
function authFixture() {
  const users = {
    findByEmail: vi.fn<UsersService['findByEmail']>().mockResolvedValue(null),
    startSession: vi.fn().mockResolvedValue(true),
  };
  const auth = new AuthService(
    users as unknown as UsersService,
    new JwtService({ secret: 'public-reservation-test-key' }),
  );
  const login = (email = user.email, suppliedPassword = password) =>
    auth.login({ email, password: suppliedPassword });
  return { users, auth, login };
}

let app: NestFastifyApplication | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
  vi.useRealTimers();
});

test('login reserves five pending attempts synchronously and keeps email limits independent', async () => {
  const f = authFixture();
  const query = deferred<User | null>();
  f.users.findByEmail.mockReturnValue(query.promise);
  const pending = Array.from({ length: 5 }, () => f.login());
  const results = Promise.allSettled(pending);
  await expectRateLimit(f.login());
  expect(f.users.findByEmail).toHaveBeenCalledTimes(5);
  const other = f.login('other@example.com');
  const otherResult = Promise.allSettled([other]);
  expect(f.users.findByEmail).toHaveBeenCalledTimes(6);
  query.resolve(null);
  expect((await results).every((result) => result.status === 'rejected')).toBe(
    true,
  );
  await otherResult;
  await expectRateLimit(f.login());
});

test('login infrastructure failures release reservations without consuming credential failures', async () => {
  const f = authFixture();
  f.users.findByEmail.mockRejectedValue(new Error('Database unavailable'));
  for (let i = 0; i < 7; i++)
    await expect(f.login()).rejects.toThrow('Database unavailable');
  f.users.findByEmail.mockResolvedValue(user);
  await expect(f.login()).resolves.toHaveProperty('accessToken');
  f.users.startSession.mockRejectedValue(new Error('Session unavailable'));
  for (let i = 0; i < 7; i++)
    await expect(f.login()).rejects.toThrow('Session unavailable');
});

test('incorrect passwords consume the login budget and a completed valid login resets it', async () => {
  const f = authFixture();
  f.users.findByEmail.mockResolvedValue(user);
  for (let i = 0; i < 4; i++) {
    await expect(f.login(user.email, 'incorrect')).rejects.toMatchObject({
      status: 401,
    });
  }
  await f.login();
  for (let i = 0; i < 5; i++) {
    await expect(f.login(user.email, 'incorrect')).rejects.toMatchObject({
      status: 401,
    });
  }
  await expectRateLimit(f.login());
});

test('a valid password resets failures while preserving other pending login reservations', async () => {
  const f = authFixture();
  for (let i = 0; i < 3; i++)
    await expect(f.login()).rejects.toMatchObject({ status: 401 });
  const query = deferred<User | null>();
  f.users.findByEmail.mockReturnValue(query.promise);
  const older = f.login();
  const olderResult = Promise.allSettled([older]);
  f.users.findByEmail.mockResolvedValueOnce(user);
  await f.login();
  const others = Array.from({ length: 4 }, () => f.login());
  const othersResult = Promise.allSettled(others);
  await expectRateLimit(f.login());
  query.resolve(null);
  await olderResult;
  await othersResult;
  await expectRateLimit(f.login());
});

test('lockout expiry and periodic cleanup retain in-flight login reservations', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  const f = authFixture();
  for (let i = 0; i < 4; i++)
    await expect(f.login()).rejects.toMatchObject({ status: 401 });
  const query = deferred<User | null>();
  f.users.findByEmail.mockReturnValue(query.promise);
  const old = f.login();
  const oldResult = Promise.allSettled([old]);
  f.auth.onModuleInit();
  vi.advanceTimersByTime(31 * 60 * 1000);
  const fresh = Array.from({ length: 4 }, () => f.login());
  const freshResult = Promise.allSettled(fresh);
  await expectRateLimit(f.login());
  query.resolve(null);
  await oldResult;
  await freshResult;
  await expectRateLimit(f.login());
  vi.advanceTimersByTime(15 * 60 * 1000 + 1);
  await expect(f.login()).rejects.toMatchObject({ status: 401 });
  f.auth.onModuleDestroy();
});

function registrationFixture() {
  const register = vi.fn<AuthService['register']>();
  const cookie = { set: vi.fn() };
  const controller = new AuthController(
    { register } as unknown as AuthService,
    cookie as unknown as RefreshTokenCookieService,
  );
  const signup = (ip = 'test-ip') =>
    controller.register(
      { email: 'new@example.com', username: 'new_user', password },
      ip,
      {} as CookieReplyLike,
    );
  return { register, signup };
}
const registration = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: { email: 'new@example.com', username: 'new_user', avatar: null },
};

test('registration reserves only three concurrent successes per IP and releases failed attempts', async () => {
  const f = registrationFixture();
  const query = deferred<typeof registration>();
  f.register.mockReturnValue(query.promise);
  const pending = Array.from({ length: 3 }, () => f.signup());
  const results = Promise.allSettled(pending);
  await expectRateLimit(f.signup());
  const other = f.signup('another-ip');
  const otherResult = Promise.allSettled([other]);
  expect(f.register).toHaveBeenCalledTimes(4);
  query.reject(new Error('Duplicate registration'));
  await results;
  await otherResult;
  f.register.mockResolvedValue(registration);
  for (let i = 0; i < 3; i++)
    await expect(f.signup()).resolves.toHaveProperty('accessToken');
  await expectRateLimit(f.signup());
});

test('registration expiry preserves pending operations and does not reset a concurrent reservation', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const f = registrationFixture();
  f.register.mockResolvedValue(registration);
  await f.signup();
  await f.signup();
  const query = deferred<typeof registration>();
  f.register.mockReturnValue(query.promise);
  const old = f.signup();
  const oldResult = Promise.allSettled([old]);
  vi.setSystemTime(Date.now() + 60 * 60 * 1000 + 1);
  const fresh = [f.signup(), f.signup()];
  const freshResult = Promise.allSettled(fresh);
  await expectRateLimit(f.signup());
  query.resolve(registration);
  await oldResult;
  await freshResult;
  await expectRateLimit(f.signup());
});

function exportFixture() {
  const findMany = vi.fn();
  const service = new TasksService(
    { task: { findMany } } as unknown as PrismaService,
    {} as ImageUploadService,
  );
  return { findMany, service };
}

test('export reserves before its query, releases failure, and starts cooldown at successful completion', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  const f = exportFixture();
  const query = deferred<[]>();
  f.findMany.mockReturnValue(query.promise);
  const pending = f.service.getTasksForExport('owner');
  const result = Promise.allSettled([pending]);
  await expectRateLimit(f.service.getTasksForExport('owner'));
  f.service.onModuleInit();
  vi.advanceTimersByTime(31 * 60 * 1000);
  await expectRateLimit(f.service.getTasksForExport('owner'));
  const other = f.service.getTasksForExport('another-owner');
  const otherResult = Promise.allSettled([other]);
  expect(f.findMany).toHaveBeenCalledTimes(2);
  query.reject(new Error('Export query failed'));
  await result;
  await otherResult;
  f.findMany.mockResolvedValue([]);
  await expect(f.service.getTasksForExport('owner')).resolves.toEqual([]);
  await expectRateLimit(f.service.getTasksForExport('owner'));
  vi.advanceTimersByTime(5 * 60 * 1000);
  await expect(f.service.getTasksForExport('owner')).resolves.toEqual([]);
  f.service.onModuleDestroy();
});

test('a long successful export keeps its reservation and receives a full cooldown after completion', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  const f = exportFixture();
  const query = deferred<[]>();
  f.findMany.mockReturnValue(query.promise);
  const pending = f.service.getTasksForExport('owner');
  f.service.onModuleInit();
  vi.advanceTimersByTime(31 * 60 * 1000);
  await expectRateLimit(f.service.getTasksForExport('owner'));
  query.resolve([]);
  await pending;
  vi.advanceTimersByTime(5 * 60 * 1000 - 1);
  await expectRateLimit(f.service.getTasksForExport('owner'));
  vi.advanceTimersByTime(1);
  await expect(f.service.getTasksForExport('owner')).resolves.toEqual([]);
  f.service.onModuleDestroy();
});

test('recovery HTTP status and response match for registered and unknown addresses without account lookups', async () => {
  const f = authFixture();
  f.users.findByEmail.mockImplementation(async (email) =>
    email === user.email ? user : null,
  );
  @Module({
    controllers: [AuthController],
    providers: [
      { provide: AuthService, useValue: f.auth },
      { provide: RefreshTokenCookieService, useValue: {} },
    ],
  })
  class TestModule {}
  app = await NestFactory.create<NestFastifyApplication>(
    TestModule,
    new FastifyAdapter(),
    { logger: false },
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();
  const server = app.getHttpAdapter().getInstance();
  for (const expectedStatus of [200, 429]) {
    const responses = await Promise.all(
      [user.email, 'unknown@example.com'].map((email) =>
        server.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: { email },
        }),
      ),
    );
    expect(responses[0].statusCode).toBe(expectedStatus);
    expect(responses[1].statusCode).toBe(expectedStatus);
    expect(responses[0].json()).toEqual(responses[1].json());
  }
  expect(f.users.findByEmail).not.toHaveBeenCalled();
});
