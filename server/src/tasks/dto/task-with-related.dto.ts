import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Task } from '@prisma/client';
import { IsArray, IsOptional } from 'class-validator';
import { TaskColor } from './create-task.dto';
import { TaskImageResponseDto } from './task-image.dto';

export class SubtaskDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Subtask title' })
  title: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  taskId: string;
}

export class TaskWithRelatedDto implements Task {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Task title' })
  title: string;

  @ApiPropertyOptional({ example: 'Task description' })
  description: string | null;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiPropertyOptional({
    enum: TaskColor,
    enumName: 'TaskColor',
    example: TaskColor.STANDART,
  })
  color: TaskColor | null;

  @ApiPropertyOptional({ example: '2025-03-14T00:00:00.000Z' })
  dueDate: string | null;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ example: '2025-03-14T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-03-14T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiPropertyOptional({ isArray: true, type: SubtaskDto })
  @IsOptional()
  @IsArray()
  subtasks?: SubtaskDto[];

  @ApiPropertyOptional({ isArray: true, type: TaskImageResponseDto })
  @IsOptional()
  @IsArray()
  images?: TaskImageResponseDto[];
}
