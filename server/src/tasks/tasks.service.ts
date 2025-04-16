import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { UpdateTaskDateDto } from './dto/update-task-date.dto';
import { UpdateTaskOrderItemDto } from './dto/update-task-order.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskImageDto } from './dto/task-image.dto';
import { unlink, copyFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as path from 'path';
import { existsSync } from 'fs';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

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
        dueDate: dueDate || undefined,
      },
      include: { subtasks: true },
    });
  }

  async removeTask(userId: string, taskId: string) {
    await this.validateTaskOwnership(userId, taskId);

    const taskImages = await this.prisma.taskImage.findMany({
      where: {
        taskId,
      },
    });

    for (const image of taskImages) {
      try {
        const filePath = join(process.cwd(), image.path);
        await unlink(filePath);
      } catch (error) {
        console.error(`Error deleting image file: ${error}`);
      }
    }

    return this.prisma.task.delete({
      where: { id: taskId },
    });
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

    const newTask = await this.prisma.task.create({
      data: {
        ...taskData,
        title: `${taskData.title} (copy)`,
        order: highestOrder + 1,
      },
      include: {
        subtasks: true,
        images: true,
      },
    });

    if (subtasks && subtasks.length > 0) {
      const subtaskPromises = subtasks.map((subtask) => {
        return this.prisma.subtask.create({
          data: {
            title: subtask.title,
            completed: subtask.completed,
            taskId: newTask.id,
          },
        });
      });

      await Promise.all(subtaskPromises);
    }

    if (images && images.length > 0) {
      const uploadsDir = join(process.cwd(), 'uploads', 'tasks');

      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const imagePromises = images.map(async (image) => {
        try {
          const originalFilePath = join(process.cwd(), image.path);
          const fileName = path.basename(image.path);

          const fileExt = path.extname(fileName);
          const fileNameWithoutExt = path.basename(fileName, fileExt);
          const newFileName = `${fileNameWithoutExt}_copy_${Date.now()}${Math.floor(Math.random() * 1000)}${fileExt}`;
          const newFilePath = join('uploads', 'tasks', newFileName);
          const newFullFilePath = join(process.cwd(), newFilePath);

          await copyFile(originalFilePath, newFullFilePath);

          return this.prisma.taskImage.create({
            data: {
              filename: newFileName,
              path: `/${newFilePath}`,
              taskId: newTask.id,
            },
          });
        } catch (error) {
          console.error('Error duplicating image:', error);
          return null;
        }
      });

      await Promise.all(imagePromises);
    }

    return this.findOneTask(userId, newTask.id);
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
    const updatedTasks = await Promise.all(
      tasksOrder.map(async (item) => {
        const task = await this.prisma.task.findFirst({
          where: { id: item.id, userId },
        });

        if (!task) {
          throw new NotFoundException(`Task with id ${item.id} not found`);
        }

        const newDueDate =
          item.dueDate === null
            ? null
            : item.dueDate !== undefined
              ? item.dueDate
              : task.dueDate;

        return this.prisma.task.update({
          where: { id: item.id },
          data: {
            order: item.order,
            dueDate: newDueDate,
          },
        });
      }),
    );

    return updatedTasks;
  }

  async addTaskImage(userId: string, taskId: string, imageDto: TaskImageDto) {
    const task = await this.validateTaskOwnership(userId, taskId);

    return this.prisma.taskImage.create({
      data: {
        filename: imageDto.filename,
        path: imageDto.path,
        taskId: task.id,
      },
    });
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

    try {
      const relativePath = image.path.replace(/^\/uploads/, '');
      const filePath = join(process.cwd(), 'uploads', relativePath);
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    return this.prisma.taskImage.delete({
      where: {
        id: imageId,
      },
    });
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
}
