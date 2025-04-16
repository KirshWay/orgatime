import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TaskColor {
  STANDART = 'STANDART',
  RED = 'RED',
  BLUE = 'BLUE',
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Task title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: TaskColor,
    enumName: 'TaskColor',
    example: TaskColor.STANDART,
  })
  @IsOptional()
  @IsEnum(TaskColor)
  color?: TaskColor;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ example: '2025-03-14T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
