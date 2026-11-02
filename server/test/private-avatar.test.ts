import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  Module,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RefreshTokenCookieService } from 'src/common/services/refresh-token-cookie.service';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AvatarService } from 'src/users/avatar.service';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
let directory: string;
let bytes: Buffer;
let app: NestFastifyApplication | undefined;
const prisma = { user: { findUnique: vi.fn() } };
const service = () =>
  new AvatarService(
    prisma as unknown as PrismaService,
    new ImageUploadService(),
  );
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'orgatime-private-avatar-'));
  vi.spyOn(process, 'cwd').mockReturnValue(directory);
  prisma.user.findUnique.mockReset();
  await mkdir(join(directory, 'uploads', 'avatars', 'owner'), {
    recursive: true,
  });
  bytes = await sharp({
    create: { width: 2, height: 2, channels: 3, background: 'blue' },
  })
    .webp()
    .toBuffer();
  await writeFile(
    join(directory, 'uploads', 'avatars', 'owner', 'photo.webp'),
    bytes,
  );
  await writeFile(join(directory, 'uploads', 'avatars', 'legacy.webp'), bytes);
});
afterEach(async () => {
  await app?.close();
  app = undefined;
  vi.restoreAllMocks();
  await rm(directory, { recursive: true, force: true });
});
test('avatar API requires authentication and selects only the signed-in owner; upload URLs are unavailable', async () => {
  prisma.user.findUnique.mockImplementation(async ({ where }) =>
    where.id === 'owner'
      ? { avatar: '/uploads/avatars/owner/photo.webp' }
      : null,
  );
  vi.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation(
    (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      if (!request.headers.authorization) throw new UnauthorizedException();
      request.user = { id: request.headers.authorization };
      return true;
    },
  );
  @Module({
    controllers: [UsersController],
    providers: [
      AvatarService,
      ImageUploadService,
      { provide: PrismaService, useValue: prisma },
      { provide: UsersService, useValue: {} },
      { provide: RefreshTokenCookieService, useValue: {} },
    ],
  })
  class TestModule {}
  app = await NestFactory.create<NestFastifyApplication>(
    TestModule,
    new FastifyAdapter(),
    { logger: false },
  );
  app.setGlobalPrefix('api');
  await app.init();
  for (const method of ['GET', 'HEAD'] as const) {
    for (const [authorization, status] of [
      [undefined, 401],
      ['other', 404],
      ['owner', 200],
    ] as const) {
      const response = await app.inject({
        method,
        url: '/api/users/avatar/content?userId=owner',
        headers: authorization ? { authorization } : {},
      });
      expect(response.statusCode).toBe(status);
      if (status === 200) {
        expect(response.headers['cache-control']).toBe('private, no-store');
        expect(response.headers['content-type']).toBe('image/webp');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.rawPayload).toEqual(
          method === 'GET' ? bytes : Buffer.alloc(0),
        );
      }
    }
    for (const url of [
      '/uploads/avatars/owner/photo.webp',
      '/uploads/avatars/legacy.webp',
      '/uploads/tasks/photo.webp',
    ]) {
      expect((await app.inject({ method, url })).statusCode).toBe(404);
    }
  }
});
test('legacy flat avatars load; foreign directories, traversal, external URLs and missing files are rejected', async () => {
  prisma.user.findUnique.mockResolvedValue({
    avatar: '/uploads/avatars/legacy.webp',
  });
  expect((await service().getContent('owner')).buffer).toEqual(bytes);
  for (const avatar of [
    null,
    '/uploads/avatars/other/photo.webp',
    '/uploads/avatars/../legacy.webp',
    '/uploads/avatars/owner/../../legacy.webp',
    'https://example.test/image.webp',
    '/uploads/avatars/missing.webp',
  ]) {
    prisma.user.findUnique.mockResolvedValue({ avatar });
    await expect(service().getContent('owner')).rejects.toThrow(
      'Avatar not found',
    );
  }
});
