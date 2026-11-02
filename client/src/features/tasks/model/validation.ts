import * as z from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().nullable(),
  completed: z.boolean().optional(),
  color: z.enum(['STANDART', 'RED', 'BLUE']).nullable().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
