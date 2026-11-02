import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, ValidateIf } from 'class-validator';

import { Username } from '../../common/validators/username';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'newUsername' })
  @ValidateIf((_object, value) => value !== undefined)
  @Username()
  username?: string;

  @ApiPropertyOptional({ example: 'newemail@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
