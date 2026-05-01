import { z } from 'zod';

/**
 * Mirrors the backend's class-validator constraints from
 *   packages/shared/src/dtos/auth/{register,login,refresh-token}.dto.ts
 *
 * Keep these byte-identical to the server. If the server constraint changes,
 * change it here too — schemas are checked at form submit; the server is still
 * the source of truth.
 */

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email').max(255),
  password: z.string().min(1, 'Password required').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email').max(255),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .max(128)
    .regex(PASSWORD_REGEX, 'Need an uppercase letter, lowercase letter, and a digit'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
