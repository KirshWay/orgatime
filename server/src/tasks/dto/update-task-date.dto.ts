import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDateDto {
  @ApiProperty({
    enum: ['tomorrow', 'nextWeek', 'someday', 'custom'],
    example: 'tomorrow',
    description: 'Action to update the task date',
  })
  @IsString()
  @IsIn(['tomorrow', 'nextWeek', 'someday', 'custom'])
  action: 'tomorrow' | 'nextWeek' | 'someday' | 'custom';

  @ApiPropertyOptional({
    example: '2025-03-20T00:00:00.000Z',
    description: 'Custom date if action is "custom"',
  })
  @IsOptional()
  @IsDateString()
  customDate?: string;
}
