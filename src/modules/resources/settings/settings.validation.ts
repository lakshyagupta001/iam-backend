import { z } from 'zod';

export const updateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100, 'Key is too long'),
  value: z.string().min(1, 'Value is required').max(500, 'Value is too long'),
});
