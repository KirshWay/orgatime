import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Module, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TasksController } from 'src/tasks/tasks.controller';
import { TasksService } from 'src/tasks/tasks.service';
import { AvatarService } from 'src/users/avatar.service';
import { resolveTaskImagePath } from 'src/utils/task-image-path';

let directory: string;
let app: NestFastifyApplication | undefined;
let imageBytes: Buffer;
const image = {
  id: 'image',
  taskId: 'task',
  filename: 'original_copy_123.webp',
  path: '/uploads/tasks/original_copy_123.webp',
};
const prisma = {
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  task: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  taskImage: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  user: { findUnique: vi.fn(), updateMany: vi.fn() },
};
const uploads = new ImageUploadService();
const service = () =>
  new TasksService(prisma as unknown as PrismaService, uploads);
const request = () => ({
  file: vi.fn(async () => ({
    fieldname: 'image',
    filename: 'input.webp',
    mimetype: 'image/webp',
    toBuffer: async () => imageBytes,
  })),
});

function barrier() {
  let release!: () => void;
  const reached = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { reached, release };
}

function concurrentTaskStore() {
  let exists = true;
  let images = [image];
  let lastTransaction = Promise.resolve();
  const beforeInsert = vi.fn(async () => {});
  const afterSnapshot = vi.fn(async () => {});
  const lockRequested = vi.fn();
  prisma.task.findFirst.mockImplementation(async () =>
    exists ? { id: 'task' } : null,
  );
  prisma.taskImage.create.mockImplementation(async ({ data }) => {
    await beforeInsert();
    if (!exists) throw new Error('Task foreign key violation');
    const created = { ...data, id: 'new-image', taskId: 'task' };
    images.push(created);
    return created;
  });
  prisma.taskImage.findMany.mockImplementation(async () => {
    const snapshot = [...images];
    await afterSnapshot();
    return snapshot;
  });
  prisma.task.delete.mockImplementation(async () => {
    exists = false;
    images = [];
    return { id: 'task' };
  });
  prisma.$transaction.mockImplementation(async (operation) => {
    let unlock: (() => void) | undefined;
    const transaction = {
      ...prisma,
      $queryRaw: async () => {
        lockRequested();
        const previousTransaction = lastTransaction;
        const finished = barrier();
        lastTransaction = finished.reached;
        await previousTransaction;
        unlock = finished.release;
        return exists ? [{ id: 'task' }] : [];
      },
    };
    try {
      return await operation(transaction);
    } finally {
      unlock?.();
    }
  });
  return { beforeInsert, afterSnapshot, lockRequested };
}

beforeEach(async () => {
  vi.resetAllMocks();
  prisma.$transaction.mockImplementation((operation) => operation(prisma));
  prisma.$queryRaw.mockResolvedValue([{ id: 'task' }]);
  directory = await mkdtemp(join(tmpdir(), 'orgatime-private-'));
  vi.spyOn(process, 'cwd').mockReturnValue(directory);
  await mkdir(join(directory, 'uploads', 'tasks'), { recursive: true });
  imageBytes = await sharp({
    create: { width: 2, height: 3, channels: 4, background: '#fff' },
  })
    .webp()
    .toBuffer();
  await writeFile(resolveTaskImagePath(image), imageBytes);
});
afterEach(async () => {
  await app?.close();
  app = undefined;
  vi.restoreAllMocks();
  await rm(directory, { recursive: true, force: true });
});

test('content HTTP route requires authentication and the exact owned task/image relation for GET and HEAD', async () => {
  prisma.taskImage.findFirst.mockImplementation(async ({ where }) =>
    where.id === 'image' &&
    where.taskId === 'task' &&
    where.task.userId === 'owner'
      ? image
      : null,
  );
  vi.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation(
    (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      if (!req.headers.authorization) throw new UnauthorizedException();
      req.user = { id: req.headers.authorization };
      return true;
    },
  );
  @Module({
    controllers: [TasksController],
    providers: [
      TasksService,
      ImageUploadService,
      { provide: PrismaService, useValue: prisma },
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
      ['foreign', 404],
      ['owner', 200],
    ] as const) {
      const response = await app.inject({
        method,
        url: '/api/tasks/task/images/image/content',
        headers: authorization ? { authorization } : {},
      });
      expect(response.statusCode).toBe(status);
      if (status === 200) {
        expect(response.headers['cache-control']).toBe('private, no-store');
        expect(response.headers['content-type']).toBe('image/webp');
        expect(response.rawPayload).toEqual(
          method === 'GET' ? imageBytes : Buffer.alloc(0),
        );
      } else expect(response.rawPayload).not.toEqual(imageBytes);
    }
  }
  const wrongTask = await app.inject({
    url: '/api/tasks/other/images/image/content',
    headers: { authorization: 'owner' },
  });
  expect(wrongTask.statusCode).toBe(404);
});

test('foreign uploads reject ownership before consuming multipart data or creating files', async () => {
  prisma.task.findFirst.mockResolvedValue(null);
  const upload = request();
  await expect(
    service().uploadTaskImage('foreign', 'task', upload),
  ).rejects.toThrow('Task not found');
  expect(upload.file).not.toHaveBeenCalled();
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(await readdir(join(directory, 'uploads', 'tasks'))).toEqual([
    image.filename,
  ]);
});

test('upload persistence failure removes the new image and preserves existing files', async () => {
  prisma.task.findFirst.mockResolvedValue({ id: 'task' });
  prisma.taskImage.create.mockRejectedValue(new Error('database failed'));
  await expect(
    service().uploadTaskImage('owner', 'task', request()),
  ).rejects.toThrow('database failed');
  expect(await readdir(join(directory, 'uploads', 'tasks'))).toEqual([
    image.filename,
  ]);
});

test('task deletion failure preserves referenced files', async () => {
  prisma.task.findFirst.mockResolvedValue({ id: 'task' });
  prisma.taskImage.findMany.mockResolvedValue([image]);
  prisma.task.delete.mockRejectedValue(new Error('database failed'));
  await expect(service().removeTask('owner', 'task')).rejects.toThrow(
    'database failed',
  );
  expect(await readFile(resolveTaskImagePath(image))).toEqual(imageBytes);
});

test('deletion rejects a foreign task before reading its attachments or deleting files', async () => {
  prisma.$queryRaw.mockResolvedValue([]);
  await expect(service().removeTask('foreign', 'task')).rejects.toThrow(
    'Task not found',
  );
  const [query, ...parameters] = prisma.$queryRaw.mock.calls[0];
  expect(query.join('?')).toMatch(
    /SELECT "id" FROM "Task"\s+WHERE "id" = \? AND "userId" = \?\s+FOR UPDATE/,
  );
  expect(parameters).toEqual(['task', 'foreign']);
  expect(prisma.taskImage.findMany).not.toHaveBeenCalled();
  expect(prisma.task.delete).not.toHaveBeenCalled();
  expect(await readFile(resolveTaskImagePath(image))).toEqual(imageBytes);
});

test('task deletion commit failure preserves referenced files', async () => {
  prisma.taskImage.findMany.mockResolvedValue([image]);
  prisma.task.delete.mockResolvedValue({ id: 'task' });
  prisma.$transaction.mockImplementation(async (operation) => {
    await operation(prisma);
    throw new Error('commit failed');
  });
  await expect(service().removeTask('owner', 'task')).rejects.toThrow(
    'commit failed',
  );
  expect(await readFile(resolveTaskImagePath(image))).toEqual(imageBytes);
});

test('deletion waits for an inserting upload and removes its committed file', async () => {
  const store = concurrentTaskStore();
  const inserting = barrier();
  const allowInsert = barrier();
  store.beforeInsert.mockImplementation(async () => {
    inserting.release();
    await allowInsert.reached;
  });
  const tasks = service();
  const upload = tasks.uploadTaskImage('owner', 'task', request()).then(
    (value) => ({ value, error: undefined }),
    (error) => ({ value: undefined, error }),
  );
  await inserting.reached;
  const deletion = tasks.removeTask('owner', 'task');
  await vi.waitFor(() => {
    expect(
      store.lockRequested.mock.calls.length >= 2 ||
        prisma.taskImage.findMany.mock.calls.length > 0,
    ).toBe(true);
  });
  allowInsert.release();
  const result = await upload;
  expect(result.error).toBeUndefined();
  expect(result.value?.id).toBe('new-image');
  await deletion;
  expect(await readdir(join(directory, 'uploads', 'tasks'))).toEqual([]);
});

test('upload waiting behind deletion rejects and removes its converted file', async () => {
  const store = concurrentTaskStore();
  const snapshotRead = barrier();
  const allowDeletion = barrier();
  store.afterSnapshot.mockImplementation(async () => {
    snapshotRead.release();
    await allowDeletion.reached;
  });
  const tasks = service();
  const deletion = tasks.removeTask('owner', 'task');
  await snapshotRead.reached;
  const upload = tasks.uploadTaskImage('owner', 'task', request()).then(
    (value) => ({ value, error: undefined }),
    (error) => ({ value: undefined, error }),
  );
  await vi.waitFor(() => {
    expect(
      store.lockRequested.mock.calls.length >= 2 ||
        prisma.taskImage.create.mock.calls.length > 0,
    ).toBe(true);
  });
  allowDeletion.release();
  await deletion;
  const result = await upload;
  expect(result.error).toMatchObject({ message: 'Task not found' });
  expect(await readdir(join(directory, 'uploads', 'tasks'))).toEqual([]);
});

test('duplicate rolls back copied files on persistence failure and accepts legacy copy names', async () => {
  prisma.task.findFirst.mockResolvedValue({
    id: 'task',
    userId: 'owner',
    title: 'Original',
    dueDate: null,
    images: [image],
    subtasks: [],
  });
  prisma.task.findMany.mockResolvedValue([]);
  prisma.task.create.mockImplementation(async ({ data }) => {
    const copy = data.images.create[0];
    expect(await readFile(resolveTaskImagePath(copy))).toEqual(imageBytes);
    throw new Error('database failed');
  });
  await expect(service().duplicateTask('owner', 'task')).rejects.toThrow(
    'database failed',
  );
  expect(await readdir(join(directory, 'uploads', 'tasks'))).toEqual([
    image.filename,
  ]);
});

test.each([
  '../../victim.webp',
  '../original.webp',
  'bad%2fimage.webp',
  'x\\y.webp',
])('rejects unsafe stored image name %s', (filename) => {
  expect(() =>
    resolveTaskImagePath({ filename, path: `/uploads/tasks/${filename}` }),
  ).toThrow('Image not found');
});

test.each([
  '/uploads/avatars/victim/abc.webp',
  '/uploads/avatars/legacy.webp',
  '/uploads/avatars/owner/../victim/abc.webp',
])(
  'avatar replacement never deletes an unowned or legacy pointer %s',
  async (oldAvatar) => {
    await mkdir(join(directory, 'uploads', 'avatars', 'victim'), {
      recursive: true,
    });
    const victim = join(directory, 'uploads', 'avatars', 'victim', 'abc.webp');
    await writeFile(victim, imageBytes);
    await writeFile(
      join(directory, 'uploads', 'avatars', 'legacy.webp'),
      imageBytes,
    );
    prisma.user.findUnique.mockResolvedValue({
      id: 'owner',
      avatar: oldAvatar,
    });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    const req = request();
    req.file.mockImplementation(async () => ({
      fieldname: 'avatar',
      filename: 'input.webp',
      mimetype: 'image/webp',
      toBuffer: async () => imageBytes,
    }));
    const result = await new AvatarService(
      prisma as unknown as PrismaService,
      uploads,
    ).upload('owner', req);
    expect(result.avatarUrl).toMatch(
      /^\/uploads\/avatars\/owner\/[a-f0-9-]+\.webp$/,
    );
    expect(await readFile(victim)).toEqual(imageBytes);
    expect(
      await readFile(join(directory, 'uploads', 'avatars', 'legacy.webp')),
    ).toEqual(imageBytes);
  },
);

test.each([0, 'failure'])(
  'avatar CAS conflict or persistence failure removes only the new file (%s)',
  async (outcome) => {
    const oldAvatar = '/uploads/avatars/owner/abc.webp';
    const avatarDirectory = join(directory, 'uploads', 'avatars', 'owner');
    await mkdir(avatarDirectory, { recursive: true });
    await writeFile(join(avatarDirectory, 'abc.webp'), imageBytes);
    prisma.user.findUnique.mockResolvedValue({
      id: 'owner',
      avatar: oldAvatar,
    });
    if (outcome === 0) prisma.user.updateMany.mockResolvedValue({ count: 0 });
    else prisma.user.updateMany.mockRejectedValue(new Error('database failed'));
    const req = request();
    req.file.mockImplementation(async () => ({
      fieldname: 'avatar',
      filename: 'input.webp',
      mimetype: 'image/webp',
      toBuffer: async () => imageBytes,
    }));
    await expect(
      new AvatarService(prisma as unknown as PrismaService, uploads).upload(
        'owner',
        req,
      ),
    ).rejects.toThrow();
    expect(await readdir(avatarDirectory)).toEqual(['abc.webp']);
  },
);

test('successful duplication persists copied images atomically with subtasks', async () => {
  prisma.task.findFirst.mockResolvedValue({
    id: 'task',
    userId: 'owner',
    title: 'Original',
    dueDate: null,
    images: [image],
    subtasks: [{ title: 'Child', completed: true }],
  });
  prisma.task.findMany.mockResolvedValue([]);
  prisma.task.create.mockImplementation(async ({ data }) => ({
    id: 'copy',
    ...data,
    images: data.images.create,
    subtasks: data.subtasks.create,
  }));
  const copy = await service().duplicateTask('owner', 'task');
  expect(copy.title).toBe('Original (copy)');
  expect(copy.subtasks).toEqual([{ title: 'Child', completed: true }]);
  expect(copy.images[0].filename).not.toBe(image.filename);
  expect(await readFile(resolveTaskImagePath(copy.images[0]))).toEqual(
    imageBytes,
  );
  expect(await readFile(resolveTaskImagePath(image))).toEqual(imageBytes);
});

test('corrupt image bytes and a mismatched stored path cannot be served', async () => {
  prisma.taskImage.findFirst.mockResolvedValue(image);
  await writeFile(resolveTaskImagePath(image), 'not an image');
  await expect(
    service().getTaskImageContent('owner', 'task', 'image'),
  ).rejects.toThrow('Image not found');
  prisma.taskImage.findFirst.mockResolvedValue({
    ...image,
    path: '/uploads/avatars/victim.webp',
  });
  await expect(
    service().getTaskImageContent('owner', 'task', 'image'),
  ).rejects.toThrow('Image not found');
});

test('ZIP export includes valid legacy copy names and excludes unsafe attachment references', async () => {
  const { createExportZip } = await import('src/tasks/utils/export-zip');
  const tasks = [
    {
      id: 'task',
      title: 'Original',
      description: null,
      completed: false,
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'owner',
      order: 0,
      color: null,
      subtasks: [],
      images: [
        { ...image, createdAt: new Date() },
        {
          ...image,
          id: 'unsafe',
          filename: '../victim.webp',
          path: '/uploads/tasks/../victim.webp',
          createdAt: new Date(),
        },
      ],
    },
  ];
  const archive = createExportZip(tasks, join(directory, 'uploads', 'tasks'));
  const entries: string[] = [];
  archive.on('entry', (entry) => {
    entries.push(entry.name);
  });
  const chunks: Buffer[] = [];
  for await (const chunk of archive) chunks.push(chunk);
  expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
  expect(entries).toEqual(['tasks.md', `images/${image.filename}`]);
});
