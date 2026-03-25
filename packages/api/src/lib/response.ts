import type { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export function ok<T>(res: Response, data: T, message?: string, status = 200): Response {
  return res.status(status).json({ success: true, data, ...(message ? { message } : {}) });
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return ok(res, data, message, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function badRequest(res: Response, error: string, details?: unknown): Response {
  return res.status(400).json({ success: false, error, ...(details ? { details } : {}) });
}

export function unauthorized(res: Response, error = 'Unauthorized'): Response {
  return res.status(401).json({ success: false, error });
}

export function forbidden(res: Response, error = 'Forbidden'): Response {
  return res.status(403).json({ success: false, error });
}

export function notFound(res: Response, error = 'Not found'): Response {
  return res.status(404).json({ success: false, error });
}

export function conflict(res: Response, error: string): Response {
  return res.status(409).json({ success: false, error });
}

export function tooManyRequests(res: Response, error = 'Too many requests'): Response {
  return res.status(429).json({ success: false, error });
}

export function serverError(res: Response, error = 'Internal server error'): Response {
  return res.status(500).json({ success: false, error });
}

/** Paginated response wrapper */
export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
): Response {
  return res.status(200).json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/** Parse pagination query params with safe defaults */
export function parsePagination(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query['page'] ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query['limit'] ?? '20'), 10)));
  return { page, limit, skip: (page - 1) * limit };
}
