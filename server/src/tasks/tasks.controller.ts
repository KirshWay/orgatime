import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  RequestTimeoutException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskImageDto } from './dto/task-image.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { UpdateTaskDateDto } from './dto/update-task-date.dto';
import { UpdateTasksOrderDto } from './dto/update-task-order.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SearchTasksDto } from './dto/search-tasks.dto';
import { TasksService } from './tasks.service';
import { join } from 'path';
import { convertToWebp, imageFileFilter } from 'src/utils/file-upload.utils';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Update order of tasks' })
  @Patch('order')
  updateTasksOrder(@Body() dto: UpdateTasksOrderDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.updateTasksOrder(user.id, dto.tasks);
  }

  @ApiOperation({ summary: 'Create a new task' })
  @Post()
  createTask(@Body() dto: CreateTaskDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.createTask(user.id, dto);
  }

  @ApiOperation({ summary: 'Get all tasks for the user' })
  @Get()
  findAllTasks(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.findAllTasks(user.id);
  }

  @ApiOperation({ summary: 'Get a specific task by ID' })
  @Get(':taskId')
  findOneTask(@Param('taskId') taskId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.findOneTask(user.id, taskId);
  }

  @ApiOperation({ summary: 'Update a task' })
  @Patch(':taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.tasksService.updateTask(user.id, taskId, dto);
  }

  @ApiOperation({ summary: 'Delete a task' })
  @Delete(':taskId')
  removeTask(@Param('taskId') taskId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.removeTask(user.id, taskId);
  }

  @ApiOperation({ summary: 'Create a subtask for a given task' })
  @Post(':taskId/subtasks')
  createSubtask(
    @Param('taskId') taskId: string,
    @Body() dto: CreateSubtaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.tasksService.createSubtask(user.id, taskId, dto);
  }

  @ApiOperation({ summary: 'Update a subtask' })
  @Patch(':taskId/subtasks/:subtaskId')
  updateSubtask(
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.tasksService.updateSubtask(user.id, taskId, subtaskId, dto);
  }

  @ApiOperation({ summary: 'Delete a subtask' })
  @Delete(':taskId/subtasks/:subtaskId')
  removeSubtask(
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.tasksService.removeSubtask(user.id, taskId, subtaskId);
  }

  @ApiOperation({ summary: 'Update the due date of a task' })
  @Patch(':taskId/date')
  updateTaskDate(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDateDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.tasksService.updateTaskDate(user.id, taskId, dto);
  }

  @Post(':taskId/duplicate')
  duplicateTask(@Param('taskId') taskId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.duplicateTask(user.id, taskId);
  }

  @ApiOperation({ summary: 'Upload an image for a task' })
  @ApiConsumes('multipart/form-data')
  @Post(':taskId/images')
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadTaskImage(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };

    try {
      const destination = join(process.cwd(), 'uploads', 'tasks');

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Image processing timeout')), 30000);
      });

      const processingPromise = convertToWebp(file, destination);

      const { filename, path } = (await Promise.race([
        processingPromise,
        timeoutPromise,
      ])) as { filename: string; path: string };

      const imageDto: TaskImageDto = {
        filename,
        path,
      };

      return this.tasksService.addTaskImage(user.id, taskId, imageDto);
    } catch (error) {
      console.error('Error processing image:', error);
      if (
        error instanceof Error &&
        error.message === 'Image processing timeout'
      ) {
        throw new RequestTimeoutException(
          'Image processing timeout. Please try reducing the file size or uploading another image.',
        );
      }
      throw new InternalServerErrorException('Error processing image.');
    }
  }

  @ApiOperation({ summary: 'Get all images for a task' })
  @Get(':taskId/images')
  getTaskImages(@Param('taskId') taskId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.getTaskImages(user.id, taskId);
  }

  @ApiOperation({ summary: 'Delete an image from a task' })
  @Delete(':taskId/images/:imageId')
  removeTaskImage(
    @Param('taskId') taskId: string,
    @Param('imageId') imageId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.tasksService.removeTaskImage(user.id, taskId, imageId);
  }

  @ApiOperation({ summary: 'Search tasks by text query' })
  @Post('search')
  searchTasks(@Body() dto: SearchTasksDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.searchTasks(user.id, dto.query);
  }
}
