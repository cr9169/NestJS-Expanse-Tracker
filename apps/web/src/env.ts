import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  console.error('Invalid env config:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See console for details.');
}

export const env = parsed.data;
