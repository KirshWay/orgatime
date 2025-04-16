import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubtaskDto {
  @ApiProperty({ example: 'Subtask title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
