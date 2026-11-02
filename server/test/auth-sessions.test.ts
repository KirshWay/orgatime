import { createHash, randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import {
  Controller,
  Get,
  Module,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { afterEach, expect, test, vi } from 'vitest';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { RefreshTokenCookieService } from 'src/common/services/refresh-token-cookie.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

const key = 'public-auth-session-test-key';
const password = 'Password1!';
const passwordHash = bcrypt.hashSync(password, 4);

function fixture() {
  let user: User = {
    id: 'test-user',
    email: 'user@example.com',
    username: 'test_user',
    password: passwordHash,
    avatar: null,
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
  };
  const matches = (where: Prisma.UserWhereInput) =>
    (!where.id || where.id === user.id) &&
    (!where.password || where.password === user.password) &&
    (!where.passwordResetToken ||
      where.passwordResetToken === user.passwordResetToken) &&
    (!where.passwordResetExpires ||
      (user.passwordResetExpires !== null &&
        user.passwordResetExpires >
          (where.passwordResetExpires as { gt: Date }).gt)) &&
    (where.refreshToken === undefined ||
      (typeof where.refreshToken === 'object' && where.refreshToken !== null
        ? user.refreshToken?.startsWith(
            (where.refreshToken as { startsWith: string }).startsWith,
          )
        : where.refreshToken === user.refreshToken));
  const prisma = {
    user: {
      findUnique: vi.fn(
        async ({ where }: { where: { id?: string; email?: string } }) =>
          where.id === user.id || where.email === user.email
            ? { ...user }
            : null,
      ),
      findFirst: vi.fn(
        async ({ where }: { where: { passwordResetToken: string } }) =>
          where.passwordResetToken === user.passwordResetToken
            ? { ...user }
            : null,
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Prisma.UserWhereInput;
          data: Partial<User>;
        }) => {
          if (!matches(where)) return { count: 0 };
          user = { ...user, ...data };
          return { count: 1 };
        },
      ),
      update: vi.fn(async ({ data }: { data: Partial<User> }) => {
        user = {
          ...user,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
          ),
        };
        return { ...user };
      }),
      create: vi.fn(async ({ data }: { data: Partial<User> }) => {
        user = { ...user, ...data };
        return { ...user };
      }),
    },
  };
  const users = new UsersService(prisma as unknown as PrismaService);
  const jwt = new JwtService({ secret: key, signOptions: { expiresIn: '1h' } });
  const auth = new AuthService(users, jwt);
  const login = () => auth.login({ email: user.email, password });
  return {
    prisma,
    users,
    jwt,
    auth,
    login,
    row: () => user,
    set: (data: Partial<User>) => {
      user = { ...user, ...data };
    },
  };
}

let app: NestFastifyApplication | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function http(f: ReturnType<typeof fixture>) {
  @Controller('protected')
  class ProtectedController {
    @Get()
    @UseGuards(JwtAuthGuard)
    get(@Req() request: { user: { id: string; sid: string } }) {
      return request.user;
    }
  }
  const config = new ConfigService({ JWT_SECRET: key, NODE_ENV: 'production' });
  @Module({
    imports: [PassportModule],
    controllers: [AuthController, ProtectedController],
    providers: [
      { provide: AuthService, useValue: f.auth },
      { provide: ConfigService, useValue: config },
      RefreshTokenCookieService,
      JwtStrategy,
    ],
  })
  class TestModule {}
  app = await NestFactory.create<NestFastifyApplication>(
    TestModule,
    new FastifyAdapter(),
    { logger: false, abortOnError: false },
  );
  await app.register(cookie);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

function claims(f: ReturnType<typeof fixture>, accessToken: string) {
  return f.jwt.verify<{ sub: string; sid: string }>(accessToken);
}

test('HTTP rejects refresh tokens as bearer credentials and access tokens at refresh, preserving cookie and response contracts', async () => {
  const f = fixture();
  const server = await http(f);
  const login = await server.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: f.row().email, password },
  });
  expect(login.statusCode).toBe(201);
  expect(Object.keys(login.json()).sort()).toEqual(['accessToken', 'user']);
  const setCookie = String(login.headers['set-cookie']);
  expect(setCookie).toContain('HttpOnly');
  expect(setCookie).toContain('Secure');
  expect(setCookie).toContain('SameSite=Strict');
  const refreshToken = decodeURIComponent(
    setCookie.match(/^refreshToken=([^;]+)/)![1],
  );
  const accessToken = login.json().accessToken as string;
  const protectedCall = (token: string) =>
    server.inject({
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });
  expect((await protectedCall(accessToken)).statusCode).toBe(200);
  expect((await protectedCall(refreshToken)).statusCode).toBe(401);
  expect(
    (
      await server.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken: accessToken },
      })
    ).statusCode,
  ).toBe(401);
  const refreshed = await server.inject({
    method: 'POST',
    url: '/auth/refresh',
    headers: { cookie: `refreshToken=${refreshToken}` },
  });
  expect(refreshed.statusCode).toBe(200);
  expect(Object.keys(refreshed.json())).toEqual(['accessToken']);
  expect((await protectedCall(accessToken)).statusCode).toBe(200);
  const logout = await server.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { authorization: `Bearer ${accessToken}` },
  });
  expect(logout.statusCode).toBe(201);
  expect(logout.headers['set-cookie']).toBeDefined();
  expect((await protectedCall(accessToken)).statusCode).toBe(401);
});

test('HTTP logout with an expired access token revokes the refresh-cookie session and clears the cookie', async () => {
  const f = fixture();
  const server = await http(f);
  const login = await f.login();
  const current = claims(f, login.accessToken);
  const expiredAccessToken = f.jwt.sign(
    { sub: current.sub, sid: current.sid, purpose: 'access' },
    { expiresIn: -1 },
  );
  const logout = await server.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: {
      authorization: `Bearer ${expiredAccessToken}`,
      cookie: `refreshToken=${login.refreshToken}`,
    },
  });
  expect(logout.statusCode).toBe(201);
  expect(String(logout.headers['set-cookie'])).toContain('refreshToken=;');
  expect(String(logout.headers['set-cookie'])).toContain('Max-Age=0');
  expect(f.row().refreshToken).toBeNull();
  await expect(f.auth.refreshToken(login.refreshToken)).rejects.toThrow();
});

test('HTTP logout without valid credentials only clears the cookie', async () => {
  const f = fixture();
  const server = await http(f);
  const login = await f.login();
  const current = claims(f, login.accessToken);
  const end = vi.spyOn(f.users, 'endSession');
  const refreshClaims = {
    sub: current.sub,
    sid: current.sid,
    purpose: 'refresh',
    jti: randomUUID(),
  };
  const invalidRefreshTokens = [
    'invalid',
    login.accessToken,
    f.jwt.sign(refreshClaims, { expiresIn: -1 }),
    f.jwt.sign(refreshClaims, { algorithm: 'HS384' }),
    new JwtService({ secret: 'another-public-test-key' }).sign(refreshClaims),
    f.jwt.sign({ ...refreshClaims, sid: 'invalid' }),
    f.jwt.sign({ ...refreshClaims, jti: undefined }),
  ];
  for (const refreshToken of invalidRefreshTokens) {
    const logout = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: `Bearer ${login.refreshToken}`,
        cookie: `refreshToken=${refreshToken}`,
      },
    });
    expect(logout.statusCode).toBe(201);
    expect(String(logout.headers['set-cookie'])).toContain('Max-Age=0');
  }
  const anonymous = await server.inject({
    method: 'POST',
    url: '/auth/logout',
  });
  expect(anonymous.statusCode).toBe(201);
  expect(String(anonymous.headers['set-cookie'])).toContain('Max-Age=0');
  expect(end).not.toHaveBeenCalled();
  await expect(f.auth.validateUser(current.sub, current.sid)).resolves.toEqual({
    id: current.sub,
    sid: current.sid,
  });
});

test('logout parses optional bearer headers safely and falls back to a valid refresh cookie', async () => {
  for (const authorization of [
    undefined,
    null,
    [],
    {},
    42,
    'Basic invalid',
    'Bearer',
    'Bearer invalid extra',
  ]) {
    const f = fixture();
    const login = await f.login();
    await f.auth.logoutFromCredentials(authorization, login.refreshToken);
    expect(f.row().refreshToken).toBeNull();
  }
});

test('HTTP logout with an old session cannot revoke a replacement login, including bearer precedence over its cookie', async () => {
  const f = fixture();
  const server = await http(f);
  const first = await f.login();
  const second = await f.login();
  const current = claims(f, second.accessToken);
  for (const headers of [
    { cookie: `refreshToken=${first.refreshToken}` },
    {
      authorization: `Bearer ${first.accessToken}`,
      cookie: `refreshToken=${second.refreshToken}`,
    },
  ]) {
    const logout = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      headers,
    });
    expect(logout.statusCode).toBe(201);
    expect(String(logout.headers['set-cookie'])).toContain('Max-Age=0');
    await expect(
      f.auth.validateUser(current.sub, current.sid),
    ).resolves.toEqual({
      id: current.sub,
      sid: current.sid,
    });
  }
});

test('HTTP logout accepts a rotated refresh cookie only to revoke its current session', async () => {
  const f = fixture();
  const server = await http(f);
  const login = await f.login();
  const rotated = await f.auth.refreshToken(login.refreshToken);
  const logout = await server.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { cookie: `refreshToken=${login.refreshToken}` },
  });
  expect(logout.statusCode).toBe(201);
  expect(f.row().refreshToken).toBeNull();
  await expect(f.auth.refreshToken(rotated.refreshToken)).rejects.toThrow();
});

test('HTTP refresh racing after cookie logout cannot restore the session', async () => {
  const f = fixture();
  const server = await http(f);
  const login = await f.login();
  const rotate = f.users.rotateSession.bind(f.users);
  vi.spyOn(f.users, 'rotateSession').mockImplementationOnce(async (...args) => {
    const logout = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie: `refreshToken=${login.refreshToken}` },
    });
    expect(logout.statusCode).toBe(201);
    return rotate(...args);
  });
  const refresh = await server.inject({
    method: 'POST',
    url: '/auth/refresh',
    headers: { cookie: `refreshToken=${login.refreshToken}` },
  });
  expect(refresh.statusCode).toBe(401);
  expect(f.row().refreshToken).toBeNull();
});

test('HTTP cookie logout racing after a successful refresh revokes the rotated session', async () => {
  const f = fixture();
  const server = await http(f);
  const login = await f.login();
  const end = f.users.endSession.bind(f.users);
  let rotatedAccessToken: string | undefined;
  vi.spyOn(f.users, 'endSession').mockImplementationOnce(async (...args) => {
    const refresh = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: `refreshToken=${login.refreshToken}` },
    });
    expect(refresh.statusCode).toBe(200);
    rotatedAccessToken = refresh.json().accessToken;
    return end(...args);
  });
  const logout = await server.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { cookie: `refreshToken=${login.refreshToken}` },
  });
  expect(logout.statusCode).toBe(201);
  expect(f.row().refreshToken).toBeNull();
  const protectedCall = await server.inject({
    url: '/protected',
    headers: { authorization: `Bearer ${rotatedAccessToken}` },
  });
  expect(protectedCall.statusCode).toBe(401);
});

test('HTTP logout reports a session-store failure and still clears its cookie', async () => {
  const f = fixture();
  const server = await http(f);
  const login = await f.login();
  vi.spyOn(f.users, 'endSession').mockRejectedValueOnce(
    new Error('Session store unavailable'),
  );
  const logout = await server.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { cookie: `refreshToken=${login.refreshToken}` },
  });
  expect(logout.statusCode).toBe(500);
  expect(String(logout.headers['set-cookie'])).toContain('Max-Age=0');
  expect(f.row().refreshToken).not.toBeNull();
});

test('same-second refresh rotates the complete token with exactly one concurrent winner and rejects replay', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(Math.floor(Date.now() / 1000) * 1000);
  const f = fixture();
  const login = await f.login();
  const result = await Promise.allSettled([
    f.auth.refreshToken(login.refreshToken),
    f.auth.refreshToken(login.refreshToken),
  ]);
  expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const winner = result.find((r) => r.status === 'fulfilled')!;
  if (winner.status !== 'fulfilled') throw new Error('No winner');
  expect(winner.value.refreshToken).not.toBe(login.refreshToken);
  expect(f.jwt.decode(winner.value.refreshToken).iat).toBe(
    f.jwt.decode(login.refreshToken).iat,
  );
  expect(winner.value.refreshToken.slice(0, 72)).toBe(
    login.refreshToken.slice(0, 72),
  );
  await expect(f.auth.refreshToken(login.refreshToken)).rejects.toThrow();
  await expect(
    f.auth.refreshToken(winner.value.refreshToken),
  ).resolves.toHaveProperty('accessToken');
});

test('a new login revokes the previous access session and stale logout cannot revoke its successor', async () => {
  const f = fixture();
  const first = await f.login();
  const old = claims(f, first.accessToken);
  const second = await f.login();
  const current = claims(f, second.accessToken);
  expect(old.sid).not.toBe(current.sid);
  await expect(f.auth.validateUser(old.sub, old.sid)).rejects.toThrow();
  await f.auth.logout(old.sub, old.sid);
  await expect(f.auth.validateUser(current.sub, current.sid)).resolves.toEqual({
    id: current.sub,
    sid: current.sid,
  });
  await expect(f.auth.refreshToken(first.refreshToken)).rejects.toThrow();
});

test('logout winning between refresh read and write prevents resurrecting the session', async () => {
  const f = fixture();
  const login = await f.login();
  const current = claims(f, login.accessToken);
  const rotate = f.users.rotateSession.bind(f.users);
  vi.spyOn(f.users, 'rotateSession').mockImplementationOnce(async (...args) => {
    await f.auth.logout(current.sub, current.sid);
    return rotate(...args);
  });
  await expect(f.auth.refreshToken(login.refreshToken)).rejects.toThrow();
  expect(f.row().refreshToken).toBeNull();
});

test('password change clears pending recovery and rejects the old access and refresh session', async () => {
  const f = fixture();
  const login = await f.login();
  const current = claims(f, login.accessToken);
  f.set({
    passwordResetToken: 'pending',
    passwordResetExpires: new Date(Date.now() + 60000),
  });
  await f.users.changePassword(current.sub, {
    oldPassword: password,
    newPassword: 'NewPassword2!',
  });
  expect(f.row().passwordResetToken).toBeNull();
  expect(f.row().passwordResetExpires).toBeNull();
  await expect(f.auth.validateUser(current.sub, current.sid)).rejects.toThrow();
  await expect(f.auth.refreshToken(login.refreshToken)).rejects.toThrow();
  expect(await bcrypt.compare('NewPassword2!', f.row().password)).toBe(true);
});

test('two concurrent password changes have one winner', async () => {
  const f = fixture();
  const results = await Promise.allSettled([
    f.users.changePassword(f.row().id, {
      oldPassword: password,
      newPassword: 'FirstPassword2!',
    }),
    f.users.changePassword(f.row().id, {
      oldPassword: password,
      newPassword: 'OtherPassword2!',
    }),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
});

test('password reset is consumed atomically and revokes access and refresh tokens', async () => {
  const f = fixture();
  const login = await f.login();
  const current = claims(f, login.accessToken);
  const token = 'public-reset-fixture';
  f.set({
    passwordResetToken: createHash('sha256').update(token).digest('hex'),
    passwordResetExpires: new Date(Date.now() + 60000),
  });
  const results = await Promise.allSettled([
    f.auth.resetPassword({ token, newPassword: 'FirstPassword2!' }),
    f.auth.resetPassword({ token, newPassword: 'OtherPassword2!' }),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(f.row().passwordResetToken).toBeNull();
  expect(f.row().passwordResetExpires).toBeNull();
  expect(f.row().refreshToken).toBeNull();
  await expect(f.auth.validateUser(current.sub, current.sid)).rejects.toThrow();
  await expect(f.auth.refreshToken(login.refreshToken)).rejects.toThrow();
  await expect(
    f.auth.resetPassword({ token, newPassword: 'AgainPassword2!' }),
  ).rejects.toThrow();
});

test('reset expiration is checked at consumption after password hashing', async () => {
  const f = fixture();
  const token = 'expiring-reset';
  f.set({
    passwordResetToken: createHash('sha256').update(token).digest('hex'),
    passwordResetExpires: new Date(Date.now() + 60000),
  });
  const consume = f.users.consumePasswordResetToken.bind(f.users);
  vi.spyOn(f.users, 'consumePasswordResetToken').mockImplementationOnce(
    async (...args) => {
      f.set({ passwordResetExpires: new Date(Date.now() - 1) });
      return consume(...args);
    },
  );
  await expect(
    f.auth.resetPassword({ token, newPassword: 'FirstPassword2!' }),
  ).rejects.toThrow();
  expect(f.row().password).toBe(passwordHash);
});

test('login verified before a password reset cannot restore a session afterward', async () => {
  const f = fixture();
  const start = f.users.startSession.bind(f.users);
  vi.spyOn(f.users, 'startSession').mockImplementationOnce(async (...args) => {
    const token = 'reset-during-login';
    f.set({
      passwordResetToken: createHash('sha256').update(token).digest('hex'),
      passwordResetExpires: new Date(Date.now() + 60000),
    });
    await f.auth.resetPassword({ token, newPassword: 'ChangedPassword2!' });
    return start(...args);
  });
  await expect(f.login()).rejects.toThrow();
  expect(f.row().refreshToken).toBeNull();
});

test('profile and registration persistence whitelist fields even for direct service calls', async () => {
  const f = fixture();
  await f.users.updateProfile(f.row().id, {
    username: 'new_name',
    avatar: '/uploads/avatars/other.webp',
    password: 'tampered',
  } as Parameters<UsersService['updateProfile']>[1]);
  expect(f.row().avatar).toBeNull();
  expect(f.row().password).toBe(passwordHash);
  await f.auth.register({
    email: 'new@example.com',
    username: 'new_user',
    password,
    avatar: '/uploads/avatars/other.webp',
  } as Parameters<AuthService['register']>[0]);
  expect(f.row().avatar).toBeNull();
});

test('legacy hashes, malformed claims, wrong algorithms and expiration fail closed', async () => {
  const f = fixture();
  const server = await http(f);
  const sid = randomUUID();
  const base = { sub: f.row().id, sid, purpose: 'access' };
  f.set({ refreshToken: `v1:${sid}:${'a'.repeat(64)}` });
  for (const token of [
    f.jwt.sign({ sub: f.row().id }),
    new JwtService({ secret: key }).sign(base),
    f.jwt.sign({ ...base, sub: 42 }),
    f.jwt.sign({ ...base, sid: 'not-a-session' }),
    f.jwt.sign({ ...base, purpose: 'refresh', jti: randomUUID() }),
    f.jwt.sign(base, { algorithm: 'HS384', expiresIn: '1h' }),
    f.jwt.sign(base, { expiresIn: -1 }),
    f.jwt.sign(base, { noTimestamp: true, expiresIn: '1h' }),
  ]) {
    expect(
      (
        await server.inject({
          url: '/protected',
          headers: { authorization: `Bearer ${token}` },
        })
      ).statusCode,
    ).toBe(401);
    await expect(f.auth.refreshToken(token)).rejects.toThrow();
  }
  const login = await f.login();
  const current = claims(f, login.accessToken);
  f.set({ refreshToken: await bcrypt.hash(login.refreshToken, 4) });
  await expect(f.auth.validateUser(current.sub, current.sid)).rejects.toThrow();
  await expect(f.auth.refreshToken(login.refreshToken)).rejects.toThrow();
  for (const token of [null, {}, 1, [], ''])
    await expect(f.auth.refreshToken(token)).rejects.toThrow();
});

test.each(['change', 'reset'] as const)(
  'a winning password %s prevents an in-flight refresh from restoring its session',
  async (operation) => {
    const f = fixture();
    const login = await f.login();
    const current = claims(f, login.accessToken);
    const token = 'public-reset-fixture';
    f.set({
      passwordResetToken: createHash('sha256').update(token).digest('hex'),
      passwordResetExpires: new Date(Date.now() + 60000),
    });
    const rotate = f.users.rotateSession.bind(f.users);
    vi.spyOn(f.users, 'rotateSession').mockImplementationOnce(
      async (...args) => {
        if (operation === 'change') {
          await f.users.changePassword(current.sub, {
            oldPassword: password,
            newPassword: 'NewPassword2!',
          });
        } else {
          await f.auth.resetPassword({ token, newPassword: 'NewPassword2!' });
        }
        return rotate(...args);
      },
    );
    await expect(f.auth.refreshToken(login.refreshToken)).rejects.toThrow();
    expect(f.row().refreshToken).toBeNull();
    await expect(
      f.auth.validateUser(current.sub, current.sid),
    ).rejects.toThrow();
  },
);

test('a password reset winning after old-password verification prevents a stale change from overwriting it', async () => {
  const f = fixture();
  const original = f.prisma.user.updateMany.getMockImplementation()!;
  let intercepted = false;
  f.prisma.user.updateMany.mockImplementation(async (args) => {
    if (!intercepted && args.where.password) {
      intercepted = true;
      const token = 'reset-during-change';
      f.set({
        passwordResetToken: createHash('sha256').update(token).digest('hex'),
        passwordResetExpires: new Date(Date.now() + 60000),
      });
      await f.auth.resetPassword({ token, newPassword: 'ResetPassword2!' });
    }
    return original(args);
  });
  await expect(
    f.users.changePassword(f.row().id, {
      oldPassword: password,
      newPassword: 'StalePassword2!',
    }),
  ).rejects.toThrow();
  expect(await bcrypt.compare('ResetPassword2!', f.row().password)).toBe(true);
});

test('legacy bcrypt passwords above 72 bytes still work for login and password change', async () => {
  const f = fixture();
  const legacyPassword = 'Aa1!' + 'é'.repeat(100);
  f.set({ password: bcrypt.hashSync(legacyPassword, 4) });
  await expect(
    f.auth.login({ email: f.row().email, password: legacyPassword }),
  ).resolves.toHaveProperty('accessToken');
  await expect(
    f.users.changePassword(f.row().id, {
      oldPassword: legacyPassword,
      newPassword: 'NewPassword2!',
    }),
  ).resolves.toHaveProperty('message');
});
