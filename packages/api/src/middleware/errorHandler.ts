import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = Array.isArray(err.meta?.['target'])
          ? (err.meta?.['target'] as string[]).join(', ')
          : 'field';
        res.status(409).json({ success: false, error: `${field} already exists` });
        return;
      }
      case 'P2025':
        res.status(404).json({ success: false, error: 'Record not found' });
        return;
      case 'P2003':
        res.status(400).json({ success: false, error: 'Related record not found' });
        return;
      default:
        logger.error('[Prisma]', { code: err.code, meta: err.meta });
        res.status(500).json({ success: false, error: 'Database error' });
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, error: 'Invalid data provided' });
    return;
  }

  // JWT errors
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }
  if (err instanceof Error && err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Token expired' });
    return;
  }

  // Generic error
  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error('[Unhandled]', { error: message, url: req.url, method: req.method });

  const status = (err as { statusCode?: number }).statusCode ?? 500;
  res.status(status).json({
    success: false,
    error: process.env['NODE_ENV'] === 'production' ? 'Internal server error' : message,
  });
}

/** Catch-all for 404 — must be registered AFTER all routes */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
}
