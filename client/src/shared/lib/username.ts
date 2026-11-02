import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(4, 'Username must be at least 4 characters')
  .max(20, 'Username must not exceed 20 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers and underscores',
  );
