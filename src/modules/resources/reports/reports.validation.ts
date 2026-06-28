import { z } from 'zod';

export const createReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.string().min(1, 'Status is required').max(50, 'Status is too long'),
});

export const updateReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.string().min(1, 'Status is required').max(50, 'Status is too long').optional(),
});
