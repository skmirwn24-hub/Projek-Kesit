import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email atau username '),
  password: z.string().min(1, 'Password '),
});

export type LoginInput = z.infer<typeof loginSchema>;
