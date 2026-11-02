import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { Username } from '../../common/validators/username';
import { PasswordByteLength } from '../../common/validators/password-byte-length';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Valid email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'JohnDoe',
    description: 'Username (4-20 characters, alphanumeric and underscores)',
  })
  @Username()
  username: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password (min 8 chars, must include uppercase, lowercase, number, and special character)',
  })
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
  password: string;
}
