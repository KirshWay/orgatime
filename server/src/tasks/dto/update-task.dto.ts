import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['dueDate'] as const),
) {
  @ApiPropertyOptional({ example: '2025-03-14T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
