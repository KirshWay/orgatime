import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { UpdateTaskDateDto } from './dto/update-task-date.dto';
import { UpdateTaskOrderItemDto } from './dto/update-task-order.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { unlink, copyFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { resolveTaskImagePath } from 'src/utils/task-image-path';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import type { MultipartRequestLike } from 'src/common/http/http.types';
import sharp from 'sharp';
import type { Prisma, Task } from '@prisma/client';

type ExportState =
  | { status: 'pending' }
  | { status: 'completed'; timestamp: number };

@Injectable()
export class TasksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TasksService.name);
  private exportCooldowns = new Map<string, ExportState>();
  private readonly EXPORT_COOLDOWN_MS = 5 * 60 * 1000;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private prisma: PrismaService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(
      () => this.cleanupStaleCooldowns(),
      30 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  private cleanupStaleCooldowns() {
    const now = Date.now();
    for (const [userId, state] of this.exportCooldowns) {
      if (
        state.status === 'completed' &&
        now - state.timestamp > this.EXPORT_COOLDOWN_MS
      ) {
        this.exportCooldowns.delete(userId);
      }
    }
  }

  async getTasksForExport(userId: string) {
    const state = this.exportCooldowns.get(userId);
    if (state?.status === 'pending') {
      throw new HttpException(
        'An export is already in progress. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (state && Date.now() - state.timestamp < this.EXPORT_COOLDOWN_MS) {
      const remainingSec = Math.ceil(
        (this.EXPORT_COOLDOWN_MS - (Date.now() - state.timestamp)) / 1000,
      );
      throw new HttpException(
        `Export is available once every 5 minutes. Try again in ${remainingSec}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const reservation: ExportState = { status: 'pending' };
    this.exportCooldowns.set(userId, reservation);
    try {
      const tasks = await this.prisma.task.findMany({
        where: { userId },
        orderBy: { order: 'asc' },
        include: { subtasks: true, images: true },
      });
      this.exportCooldowns.set(userId, {
        status: 'completed',
        timestamp: Date.now(),
      });
      return tasks;
    } catch (error) {
      if (this.exportCooldowns.get(userId) === reservation) {
        this.exportCooldowns.delete(userId);
      }
      throw error;
    }
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    const { dueDate, ...rest } = dto;

    const maxOrder = await this.prisma.task.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.task.create({
      data: {
        ...rest,
        dueDate: dueDate || null,
        userId,
        order: (maxOrder?.order || 0) + 1,
      },
    });
  }

  async findAllTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        userId,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        subtasks: true,
        images: true,
      },
    });
  }

  async findOneTask(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subtasks: true,
        images: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    await this.findOneTask(userId, taskId);

    const { dueDate, ...rest } = dto;

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        dueDate,
      },
      include: { subtasks: true },
    });
  }

  async removeTask(userId: string, taskId: string) {
    const result = await this.prisma.$transaction(async (transaction) => {
      await this.lockOwnedTask(transaction, userId, taskId);
      const taskImages = await transaction.taskImage.findMany({
        where: { taskId },
      });
      const deleted = await transaction.task.delete({
        where: { id: taskId, userId },
      });
      return { deleted, taskImages };
    });
    for (const image of result.taskImages) {
      await this.removeImageFile(image);
    }
    return result.deleted;
  }

  private async removeImageFile(image: { filename: string; path: string }) {
    try {
      await unlink(resolveTaskImagePath(image));
    } catch (error) {
      if (
        !(error instanceof NotFoundException) &&
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        this.logger.warn('Unable to remove task image file');
      }
    }
  }

  async updateTaskDate(userId: string, taskId: string, dto: UpdateTaskDateDto) {
    const task = await this.findOneTask(userId, taskId);

    let newDueDate: string | null = task.dueDate;

    const today = new Date();

    switch (dto.action) {
      case 'tomorrow': {
        const baseDate = task.dueDate ? new Date(task.dueDate) : today;
        const tomorrow = new Date(baseDate);
        tomorrow.setDate(baseDate.getDate() + 1);
        newDueDate = tomorrow.toISOString();
        break;
      }
      case 'nextWeek': {
        const baseDate = task.dueDate ? new Date(task.dueDate) : today;
        const nextWeek = new Date(baseDate);
        nextWeek.setDate(baseDate.getDate() + 7);
        newDueDate = nextWeek.toISOString();
        break;
      }
      case 'someday':
        newDueDate = null;
        break;
      case 'custom':
        if (!dto.customDate) {
          throw new Error(
            'customDate must be provided when action is "custom"',
          );
        }
        newDueDate = dto.customDate;
        break;
      default:
        throw new Error('Invalid action');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { dueDate: newDueDate },
      include: { subtasks: true },
    });
  }

  async duplicateTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      include: {
        subtasks: true,
        images: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const { id, subtasks, images, ...taskData } = task;

    const tasksWithSameDate = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: task.dueDate,
      },
      orderBy: {
        order: 'desc',
      },
      take: 1,
    });

    const highestOrder =
      tasksWithSameDate.length > 0 ? tasksWithSameDate[0].order : 0;

    const copiedImages: { filename: string; path: string }[] = [];
    try {
      await mkdir(join(process.cwd(), 'uploads', 'tasks'), { recursive: true });
      for (const image of images) {
        const source = resolveTaskImagePath(image);
        const filename = `${randomUUID()}${extname(image.filename)}`;
        const copy = { filename, path: `/uploads/tasks/${filename}` };
        copiedImages.push(copy);
        await copyFile(source, resolveTaskImagePath(copy));
      }
      return await this.prisma.task.create({
        data: {
          ...taskData,
          title: `${taskData.title} (copy)`,
          order: highestOrder + 1,
          subtasks: {
            create: subtasks.map((subtask) => ({
              title: subtask.title,
              completed: subtask.completed,
            })),
          },
          images: { create: copiedImages },
        },
        include: { subtasks: true, images: true },
      });
    } catch (error) {
      await Promise.all(
        copiedImages.map((image) => this.removeImageFile(image)),
      );
      throw error;
    }
  }

  async createSubtask(userId: string, taskId: string, dto: CreateSubtaskDto) {
    await this.findOneTask(userId, taskId);

    return this.prisma.subtask.create({
      data: {
        title: dto.title,
        completed: dto.completed ?? false,
        taskId,
      },
    });
  }

  async updateSubtask(
    userId: string,
    taskId: string,
    subtaskId: string,
    dto: UpdateSubtaskDto,
  ) {
    const task = await this.findOneTask(userId, taskId);
    const subtask = task.subtasks.find((s) => s.id === subtaskId);

    if (!subtask) {
      throw new NotFoundException(`Subtask with id ${subtaskId} not found`);
    }

    return this.prisma.subtask.update({
      where: { id: subtaskId },
      data: { ...dto },
    });
  }

  async removeSubtask(userId: string, taskId: string, subtaskId: string) {
    const task = await this.findOneTask(userId, taskId);
    const subtask = task.subtasks.find((s) => s.id === subtaskId);

    if (!subtask) {
      throw new NotFoundException(`Subtask with id ${subtaskId} not found`);
    }

    return this.prisma.subtask.delete({
      where: { id: subtaskId },
    });
  }

  async updateTasksOrder(userId: string, tasksOrder: UpdateTaskOrderItemDto[]) {
    if (tasksOrder.length === 0) return [];
    return this.prisma.$transaction(async (transaction) => {
      const tasks = await transaction.task.findMany({
        where: { userId, id: { in: tasksOrder.map((item) => item.id) } },
        select: { id: true },
      });
      const ownedIds = new Set(tasks.map((task) => task.id));
      for (const item of tasksOrder) {
        if (!ownedIds.has(item.id)) {
          throw new NotFoundException(`Task with id ${item.id} not found`);
        }
      }
      const updatedTasks: Task[] = [];
      for (const item of tasksOrder) {
        updatedTasks.push(
          await transaction.task.update({
            where: { id: item.id, userId },
            data: {
              order: item.order,
              ...(item.dueDate !== undefined ? { dueDate: item.dueDate } : {}),
            },
          }),
        );
      }
      return updatedTasks;
    });
  }

  async uploadTaskImage(
    userId: string,
    taskId: string,
    request: MultipartRequestLike,
  ) {
    await this.validateTaskOwnership(userId, taskId);
    const image = await this.imageUploadService.uploadTaskImage(request);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        await this.lockOwnedTask(transaction, userId, taskId);
        return transaction.taskImage.create({
          data: { ...image, task: { connect: { id: taskId, userId } } },
        });
      });
    } catch (error) {
      await this.removeImageFile(image);
      throw error;
    }
  }

  async getTaskImageContent(userId: string, taskId: string, imageId: string) {
    const image = await this.prisma.taskImage.findFirst({
      where: { id: imageId, taskId, task: { userId } },
    });
    if (!image) throw new NotFoundException('Image not found');
    const filePath = resolveTaskImagePath(image);
    let buffer: Buffer;
    try {
      buffer = await readFile(filePath);
    } catch {
      throw new NotFoundException('Image not found');
    }
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new NotFoundException('Image not found');
    }
    const contentTypes: Record<string, string> = {
      webp: 'image/webp',
      gif: 'image/gif',
      png: 'image/png',
      jpeg: 'image/jpeg',
    };
    const type = contentTypes[metadata.format ?? ''];
    if (!type) throw new NotFoundException('Image not found');
    return { buffer, type };
  }

  async getTaskImages(userId: string, taskId: string) {
    await this.validateTaskOwnership(userId, taskId);

    return this.prisma.taskImage.findMany({
      where: {
        taskId,
      },
    });
  }

  async removeTaskImage(userId: string, taskId: string, imageId: string) {
    await this.validateTaskOwnership(userId, taskId);

    const image = await this.prisma.taskImage.findUnique({
      where: {
        id: imageId,
        taskId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    const deleted = await this.prisma.taskImage.delete({
      where: { id: imageId },
    });
    await this.removeImageFile(image);
    return deleted;
  }

  async searchTasks(userId: string, query: string) {
    if (!query.trim()) {
      return [];
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        subtasks: true,
        images: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    const tasksWithMatchingSubtasks = await this.prisma.task.findMany({
      where: {
        userId,
        subtasks: {
          some: {
            title: { contains: query, mode: 'insensitive' },
          },
        },
      },
      include: {
        subtasks: true,
        images: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    const allTasks = [...tasks];

    for (const task of tasksWithMatchingSubtasks) {
      if (!allTasks.some((t) => t.id === task.id)) {
        allTasks.push(task);
      }
    }

    return allTasks;
  }

  private async validateTaskOwnership(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async lockOwnedTask(
    transaction: Prisma.TransactionClient,
    userId: string,
    taskId: string,
  ) {
    const tasks = await transaction.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Task"
      WHERE "id" = ${taskId} AND "userId" = ${userId}
      FOR UPDATE
    `;
    if (tasks.length === 0) throw new NotFoundException('Task not found');
  }
}
