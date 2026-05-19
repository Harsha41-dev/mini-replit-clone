import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(40),
    email: z.string().trim().email().max(80),
    password: z.string().min(6).max(80)
});

export const loginSchema = z.object({
    email: z.string().trim().email().max(80),
    password: z.string().min(6).max(80)
});
