import type { Request, Response, NextFunction } from 'express';
import { parseBearer, verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js';
import { unauthorized, forbidden } from '../lib/response.js';

// Augment Express Request to carry the decoded token
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/** Require a valid JWT access token */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = parseBearer(req.headers.authorization);

  if (!token) {
    unauthorized(res, 'No token provided');
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    unauthorized(res, 'Invalid or expired token');
  }
}

/** Require investor role */
export function requireInvestor(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'investor') {
      forbidden(res, 'Investor access required');
      return;
    }
    next();
  });
}

/** Require company_admin role */
export function requireCompanyAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'company_admin') {
      forbidden(res, 'Company admin access required');
      return;
    }
    next();
  });
}

/** Require platform admin role */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      forbidden(res, 'Admin access required');
      return;
    }
    next();
  });
}

/** Allow any authenticated user (any role) */
export function requireAnyRole(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, next);
}
