import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TaskImageDto {
  @ApiProperty({ example: 'image-123.jpg' })
  @IsNotEmpty()
  @IsString()
  filename: string;

  @ApiProperty({ example: '/uploads/tasks/image-123.jpg' })
  @IsNotEmpty()
  @IsString()
  path: string;
}

export class TaskImageResponseDto extends TaskImageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsString()
  id: string;
}
