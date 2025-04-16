import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchTasksDto {
  @ApiProperty({
    description: 'Search query for tasks',
    example: 'important task',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query: string;
}
