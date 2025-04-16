import { z } from "zod";

export const settingsSchema = z
  .object({
    username: z.string().min(4, "Username must be at least 4 characters"),
    email: z.string().email("Invalid email address"),
    oldPassword: z.string().optional().default(""),
    newPassword: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, {
        message: "Password must be at least 8 characters",
      })
      .default(""),
    confirmPassword: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && !data.oldPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["oldPassword"],
        message: "Current password is required to change password",
      });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });
