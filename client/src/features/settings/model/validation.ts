import * as z from 'zod';

import { newPasswordSchema } from '@/shared/lib/password';
import { usernameSchema } from '@/shared/lib/username';

export const createSettingsSchema = (currentUsername?: string) =>
  z
    .object({
      username:
        currentUsername === undefined
          ? usernameSchema
          : z.union([z.literal(currentUsername), usernameSchema]),
      email: z.email('Invalid email address'),
      oldPassword: z.string(),
      newPassword: z.union([z.literal(''), newPasswordSchema]),
      confirmPassword: z.string(),
    })
    .refine(
      (data) => {
        if (data.newPassword) {
          return !!data.oldPassword;
        }
        return true;
      },
      {
        message: 'Current password is required to change password',
        path: ['oldPassword'],
      },
    )
    .refine(
      (data) => {
        if (data.newPassword) {
          return data.newPassword === data.confirmPassword;
        }
        return true;
      },
      {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      },
    );

export const settingsSchema = createSettingsSchema();
