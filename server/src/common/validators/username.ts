import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export function Username() {
  return applyDecorators(
    IsString(),
    MinLength(4, { message: 'Username must be at least 4 characters' }),
    MaxLength(20, { message: 'Username must not exceed 20 characters' }),
    Matches(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers and underscores',
    }),
  );
}
