import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Target = 'body' | 'query' | 'params';

/** Zod validation middleware factory */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({ success: false, error: 'Validation failed', details: errors });
      return;
    }

    // Replace with parsed (coerced/transformed) data
    req[target] = result.data as never;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    (out[path] ??= []).push(issue.message);
  }
  return out;
}
