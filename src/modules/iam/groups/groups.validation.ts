import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  description: z.string().trim().optional(),
});

export const groupQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).optional(),
  search: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
});

export const attachPolicySchema = z.object({
  policyId: z.string().trim().uuid('Invalid policy ID format'),
});

export const idParamSchema = z.object({
  id: z.string().trim().uuid('Invalid UUID format'),
});

export const groupUserParamSchema = z.object({
  id: z.string().trim().uuid('Invalid UUID format'),
  userId: z.string().trim().uuid('Invalid UUID format'),
});

export const groupPolicyParamSchema = z.object({
  id: z.string().trim().uuid('Invalid UUID format'),
  policyId: z.string().trim().uuid('Invalid UUID format'),
});
