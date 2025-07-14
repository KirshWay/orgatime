import * as z from "zod";

export const settingsSchema = z
  .object({
    username: z.string().min(4, "Username must be at least 4 characters"),
    email: z.email("Invalid email address"),
    oldPassword: z.string(),
    newPassword: z
      .string()
      .refine(
        (val) => !val || val.length >= 8,
        "Password must be at least 8 characters",
      ),
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
      message: "Current password is required to change password",
      path: ["oldPassword"],
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
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );
