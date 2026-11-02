import { Module, ValidationPipe } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { Prisma } from '@prisma/client';
import { afterEach, expect, test, vi } from 'vitest';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TasksController } from 'src/tasks/tasks.controller';
import { TasksService } from 'src/tasks/tasks.service';

const date = '2026-11-02T00:00:00.000Z';
function fixture() {
  let rows = [
    { id: 'first', userId: 'owner', order: 1, dueDate: date, subtasks: [] },
    { id: 'second', userId: 'owner', order: 2, dueDate: date, subtasks: [] },
    {
      id: 'foreign',
      userId: 'someone-else',
      order: 1,
      dueDate: date,
      subtasks: [],
    },
  ];
  const beforeUpdate = vi.fn(async (_id: string) => {});
  const task = {
    findFirst: vi.fn(
      async ({ where }: { where: { id: string; userId: string } }) =>
        rows.find(
          (row) => row.id === where.id && row.userId === where.userId,
        ) ?? null,
    ),
    findMany: vi.fn(
      async ({ where }: { where: { id: { in: string[] }; userId: string } }) =>
        rows
          .filter(
            (row) =>
              where.id.in.includes(row.id) && row.userId === where.userId,
          )
          .map((row) => ({ id: row.id })),
    ),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string; userId?: string };
        data: Prisma.TaskUpdateInput;
      }) => {
        await beforeUpdate(where.id);
        const row = rows.find(
          (candidate) =>
            candidate.id === where.id &&
            (!where.userId || candidate.userId === where.userId),
        );
        if (!row) throw new Error('Task disappeared');
        Object.assign(
          row,
          Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
          ),
        );
        return { ...row };
      },
    ),
  };
  const prisma = {
    task,
    $transaction: vi.fn(
      async (
        operation: (transaction: { task: typeof task }) => Promise<unknown>,
      ) => {
        const snapshot = structuredClone(rows);
        try {
          return await operation({ task });
        } catch (error) {
          rows = snapshot;
          throw error;
        }
      },
    ),
  };
  const service = new TasksService(
    prisma as unknown as PrismaService,
    {} as ImageUploadService,
  );
  return { service, prisma, beforeUpdate, rows: () => rows };
}

let app: NestFastifyApplication | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});
async function http(f: ReturnType<typeof fixture>) {
  vi.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation(
    (context: ExecutionContext) => {
      context.switchToHttp().getRequest().user = { id: 'owner' };
      return true;
    },
  );
  @Module({
    controllers: [TasksController],
    providers: [{ provide: TasksService, useValue: f.service }],
  })
  class TestModule {}
  app = await NestFactory.create<NestFastifyApplication>(
    TestModule,
    new FastifyAdapter(),
    { logger: false },
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();
  return app.getHttpAdapter().getInstance();
}

test('reorder validates the complete owned batch before any update', async () => {
  for (const id of ['foreign', 'missing']) {
    const f = fixture();
    await expect(
      f.service.updateTasksOrder('owner', [
        { id: 'first', order: 5 },
        { id, order: 6 },
      ]),
    ).rejects.toMatchObject({ status: 404 });
    expect(f.prisma.task.update).not.toHaveBeenCalled();
    expect(f.rows()[0].order).toBe(1);
  }
});

test('reorder uses one transaction and ownership query, writes sequentially and returns request order', async () => {
  const f = fixture();
  let active = 0;
  f.beforeUpdate.mockImplementation(async () => {
    active += 1;
    expect(active).toBe(1);
    await Promise.resolve();
    active -= 1;
  });
  const result = await f.service.updateTasksOrder('owner', [
    { id: 'second', order: 8, dueDate: null },
    { id: 'first', order: 9 },
  ]);
  expect(result.map((row) => row.id)).toEqual(['second', 'first']);
  expect(f.prisma.$transaction).toHaveBeenCalledTimes(1);
  expect(f.prisma.task.findMany).toHaveBeenCalledExactlyOnceWith({
    where: { userId: 'owner', id: { in: ['second', 'first'] } },
    select: { id: true },
  });
  expect(f.prisma.task.findFirst).not.toHaveBeenCalled();
  expect(f.prisma.task.update.mock.calls).toEqual([
    [
      {
        where: { id: 'second', userId: 'owner' },
        data: { order: 8, dueDate: null },
      },
    ],
    [{ where: { id: 'first', userId: 'owner' }, data: { order: 9 } }],
  ]);
  expect(f.rows().find((row) => row.id === 'first')?.dueDate).toBe(date);
  expect(f.rows().find((row) => row.id === 'second')?.dueDate).toBeNull();
});

test('a failing reorder rolls back earlier updates', async () => {
  const f = fixture();
  f.beforeUpdate.mockImplementation(async (id) => {
    if (id === 'second') throw new Error('Write failed');
  });
  await expect(
    f.service.updateTasksOrder('owner', [
      { id: 'first', order: 8 },
      { id: 'second', order: 9 },
    ]),
  ).rejects.toThrow('Write failed');
  expect(f.rows().map((row) => row.order)).toEqual([1, 2, 1]);
});

test('HTTP reorder accepts an empty array and rejects oversized, duplicate and malformed items without writes', async () => {
  const f = fixture();
  const server = await http(f);
  expect(
    (
      await server.inject({
        method: 'PATCH',
        url: '/tasks/order',
        payload: { tasks: [] },
      })
    ).statusCode,
  ).toBe(200);
  const malformed = [
    Array.from({ length: 1001 }, (_, i) => ({ id: `task-${i}`, order: i })),
    [
      { id: 'first', order: 1 },
      { id: 'first', order: 2 },
    ],
    [null],
    [42],
    ['first'],
    [[]],
    [{}],
    [{ id: null, order: 1 }],
    [{ id: 'first', order: 1, dueDate: 'invalid' }],
    null,
    {},
  ];
  for (const tasks of malformed) {
    const response = await server.inject({
      method: 'PATCH',
      url: '/tasks/order',
      payload: { tasks },
    });
    expect(response.statusCode, JSON.stringify(tasks).slice(0, 80)).toBe(400);
  }
  expect(f.prisma.task.update).not.toHaveBeenCalled();
});

test('HTTP reorder accepts exactly 1000 distinct owned items and valid dates', async () => {
  const f = fixture();
  const update = vi.spyOn(f.service, 'updateTasksOrder').mockResolvedValue([]);
  const server = await http(f);
  const tasks = Array.from({ length: 1000 }, (_, i) => ({
    id: `task-${i}`,
    order: i,
    dueDate: date,
  }));
  expect(
    (
      await server.inject({
        method: 'PATCH',
        url: '/tasks/order',
        payload: { tasks },
      })
    ).statusCode,
  ).toBe(200);
  expect(update).toHaveBeenCalledWith('owner', tasks);
});

test('HTTP reorder changes dates, clears null dates and preserves omitted dates', async () => {
  const f = fixture();
  const server = await http(f);
  const newDate = '2026-11-03T00:00:00.000Z';
  const reorder = (tasks: object[]) =>
    server.inject({ method: 'PATCH', url: '/tasks/order', payload: { tasks } });
  const changed = await reorder([
    { id: 'first', order: 3, dueDate: newDate },
    { id: 'second', order: 4, dueDate: null },
  ]);
  expect(changed.statusCode).toBe(200);
  expect(
    changed.json().map((row: { dueDate: string | null }) => row.dueDate),
  ).toEqual([newDate, null]);
  expect((await reorder([{ id: 'first', order: 5 }])).statusCode).toBe(200);
  expect(f.rows()[0].dueDate).toBe(newDate);
});

test('HTTP task metadata PATCH clears explicit null, preserves omitted date, and validates date strings', async () => {
  const f = fixture();
  const server = await http(f);
  const patch = (payload: object) =>
    server.inject({ method: 'PATCH', url: '/tasks/first', payload });
  expect((await patch({ dueDate: null })).statusCode).toBe(200);
  expect(f.rows()[0].dueDate).toBeNull();
  expect((await patch({ dueDate: date })).statusCode).toBe(200);
  expect((await patch({ title: 'renamed' })).statusCode).toBe(200);
  expect(f.rows()[0].dueDate).toBe(date);
  expect((await patch({ dueDate: 'invalid' })).statusCode).toBe(400);
});
