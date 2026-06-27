import { z } from 'zod';
import { IAM_ACTIONS } from './policy.constants';
import { Effect, PolicyType } from '@prisma/client';

const effectEnum = z.string().transform(v => v.toUpperCase() as Effect).pipe(z.enum([Effect.ALLOW, Effect.DENY]));
const policyTypeEnum = z.enum([PolicyType.MANAGED, PolicyType.INLINE]);
const actionEnum = z.enum(IAM_ACTIONS);

const statementSchema = z.object({
  effect: effectEnum,
  actions: z.array(actionEnum)
    .min(1, 'At least one action is required per statement')
    .transform(actions => [...new Set(actions)]), // deduplicate
  resource: z.string().trim().default('*'),
});

export const createPolicySchema = z.object({
  name: z.string().trim().min(1, 'Policy name is required'),
  description: z.string().trim().optional(),
  type: policyTypeEnum,
  statements: z.array(statementSchema).min(1, 'At least one statement is required'),
});

export const updatePolicySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  statements: z.array(statementSchema).min(1).optional(),
});

export const policyQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().trim().optional(),
  type: policyTypeEnum.optional(),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
