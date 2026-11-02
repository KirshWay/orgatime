import { z } from 'zod';

export const newPasswordSchema = z
  .string()
  .refine(
    (value) => Array.from(value).length >= 8,
    'Password must be at least 8 characters',
  )
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Password must not exceed 72 UTF-8 bytes',
  )
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[@$!%*?&]/,
    'Password must contain at least one special character (@$!%*?&)',
  );
