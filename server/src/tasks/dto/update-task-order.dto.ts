import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaskOrderItemDto {
  @ApiProperty({ example: 'task-id-123' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  order: number;

  @ApiPropertyOptional({
    example: '2025-03-14T00:00:00.000Z',
    description:
      'New task date if it has been moved between days or null for Someday',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o: UpdateTaskOrderItemDto) => o.dueDate !== null)
  @IsDateString()
  dueDate?: string | null;
}

export class UpdateTasksOrderDto {
  @ApiProperty({ type: [UpdateTaskOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTaskOrderItemDto)
  tasks: UpdateTaskOrderItemDto[];
}
