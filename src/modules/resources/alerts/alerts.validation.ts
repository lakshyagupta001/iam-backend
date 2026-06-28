import { z } from 'zod';

export const createAlertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  message: z.string().min(1, 'Message is required').max(500, 'Message is too long'),
  severity: z.string().min(1, 'Severity is required').max(50, 'Severity is too long'),
});

export const updateAlertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long').optional(),
  message: z.string().min(1, 'Message is required').max(500, 'Message is too long').optional(),
  severity: z.string().min(1, 'Severity is required').max(50, 'Severity is too long').optional(),
});
