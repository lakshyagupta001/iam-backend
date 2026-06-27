import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import asyncHandler from 'express-async-handler';

export const validate = (schema: z.ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = await schema.parseAsync(req[source]);
      Object.defineProperty(req, source, {
        value: parsedData,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      next();
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
        return;
      }
      next(error);
    }
  });
};
