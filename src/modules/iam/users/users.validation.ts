import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const attachPolicySchema = z.object({
  policyId: z.string().trim().uuid('Invalid policy ID format'),
});

export const idParamSchema = z.object({
  id: z.string().trim().uuid('Invalid UUID format'),
});

export const userPolicyParamSchema = z.object({
  id: z.string().trim().uuid('Invalid UUID format'),
  policyId: z.string().trim().uuid('Invalid UUID format'),
});
