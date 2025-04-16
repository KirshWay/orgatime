import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'resetToken123' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newStrongPassword123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
