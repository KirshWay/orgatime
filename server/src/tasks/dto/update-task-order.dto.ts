import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
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
  @ArrayMaxSize(1000)
  @ArrayUnique((item: unknown) =>
    typeof item === 'object' && item !== null && 'id' in item ? item.id : item,
  )
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => UpdateTaskOrderItemDto)
  tasks: UpdateTaskOrderItemDto[];
}
