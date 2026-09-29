import { z } from 'zod';

export const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  APP_ENV: z.enum(['development', 'test', 'production']).default('development')
});

export type Environment = z.infer<typeof environmentSchema>;
