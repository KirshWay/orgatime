import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { PasswordByteLength } from '../../common/validators/password-byte-length';

export class ResetPasswordDto {
  @ApiProperty({ example: 'resetToken123' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewStrong1!' })
  @IsString()
  @PasswordByteLength()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/[@$!%*?&]/, {
    message: 'Password must contain at least one special character (@$!%*?&)',
  })
  newPassword: string;
}
