import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import type { MultipartRequestLike } from 'src/common/http/http.types';
import { ImageUploadService } from 'src/common/services/image-upload.service';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { SearchTasksDto } from './dto/search-tasks.dto';
import { TaskImageDto } from './dto/task-image.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { UpdateTaskDateDto } from './dto/update-task-date.dto';
import { UpdateTasksOrderDto } from './dto/update-task-order.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { generateTasksMarkdown } from './utils/export-markdown';
import { createExportZip } from './utils/export-zip';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  @ApiOperation({ summary: 'Update order of tasks' })
  @Patch('order')
  updateTasksOrder(
    @Body() dto: UpdateTasksOrderDto,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.updateTasksOrder(userId, dto.tasks);
  }

  @ApiOperation({ summary: 'Create a new task' })
  @Post()
  createTask(@Body() dto: CreateTaskDto, @CurrentUserId() userId: string) {
    return this.tasksService.createTask(userId, dto);
  }

  @ApiOperation({ summary: 'Export tasks as Markdown or ZIP' })
  @ApiQuery({
    name: 'format',
    enum: ['md', 'zip'],
    required: false,
    description: 'Export format (default: md)',
  })
  @Get('export')
  async exportTasks(
    @CurrentUserId() userId: string,
    @Query('format') format: string = 'md',
  ): Promise<StreamableFile> {
    const tasks = await this.tasksService.getTasksForExport(userId);
    const today = new Date().toISOString().slice(0, 10);

    if (format === 'zip') {
      const uploadsDir = join(process.cwd(), 'uploads', 'tasks');
      const archive = createExportZip(tasks, uploadsDir);

      return new StreamableFile(archive, {
        type: 'application/zip',
        disposition: `attachment; filename="orgatime-export-${today}.zip"`,
      });
    }

    const markdown = generateTasksMarkdown(tasks, false);

    return new StreamableFile(Buffer.from(markdown), {
      type: 'text/markdown; charset=utf-8',
      disposition: `attachment; filename="orgatime-export-${today}.md"`,
    });
  }

  @ApiOperation({ summary: 'Get all tasks for the user' })
  @Get()
  findAllTasks(@CurrentUserId() userId: string) {
    return this.tasksService.findAllTasks(userId);
  }

  @ApiOperation({ summary: 'Get a specific task by ID' })
  @Get(':taskId')
  findOneTask(
    @Param('taskId') taskId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.findOneTask(userId, taskId);
  }

  @ApiOperation({ summary: 'Update a task' })
  @Patch(':taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.updateTask(userId, taskId, dto);
  }

  @ApiOperation({ summary: 'Delete a task' })
  @Delete(':taskId')
  removeTask(@Param('taskId') taskId: string, @CurrentUserId() userId: string) {
    return this.tasksService.removeTask(userId, taskId);
  }

  @ApiOperation({ summary: 'Create a subtask for a given task' })
  @Post(':taskId/subtasks')
  createSubtask(
    @Param('taskId') taskId: string,
    @Body() dto: CreateSubtaskDto,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.createSubtask(userId, taskId, dto);
  }

  @ApiOperation({ summary: 'Update a subtask' })
  @Patch(':taskId/subtasks/:subtaskId')
  updateSubtask(
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.updateSubtask(userId, taskId, subtaskId, dto);
  }

  @ApiOperation({ summary: 'Delete a subtask' })
  @Delete(':taskId/subtasks/:subtaskId')
  removeSubtask(
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.removeSubtask(userId, taskId, subtaskId);
  }

  @ApiOperation({ summary: 'Update the due date of a task' })
  @Patch(':taskId/date')
  updateTaskDate(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDateDto,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.updateTaskDate(userId, taskId, dto);
  }

  @Post(':taskId/duplicate')
  duplicateTask(
    @Param('taskId') taskId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.duplicateTask(userId, taskId);
  }

  @ApiOperation({ summary: 'Upload an image for a task' })
  @ApiConsumes('multipart/form-data')
  @Post(':taskId/images')
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
    @Req() request: MultipartRequestLike,
    @CurrentUserId() userId: string,
  ) {
    const imageDto: TaskImageDto =
      await this.imageUploadService.uploadTaskImage(request);

    return this.tasksService.addTaskImage(userId, taskId, imageDto);
  }

  @ApiOperation({ summary: 'Get all images for a task' })
  @Get(':taskId/images')
  getTaskImages(
    @Param('taskId') taskId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.getTaskImages(userId, taskId);
  }

  @ApiOperation({ summary: 'Delete an image from a task' })
  @Delete(':taskId/images/:imageId')
  removeTaskImage(
    @Param('taskId') taskId: string,
    @Param('imageId') imageId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.tasksService.removeTaskImage(userId, taskId, imageId);
  }

  @ApiOperation({ summary: 'Search tasks by text query' })
  @Post('search')
  searchTasks(@Body() dto: SearchTasksDto, @CurrentUserId() userId: string) {
    return this.tasksService.searchTasks(userId, dto.query);
  }
}
