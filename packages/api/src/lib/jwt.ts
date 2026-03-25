import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-min-32-chars-change-in-prod';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '15m';
const REFRESH_EXPIRES_IN = process.env['REFRESH_TOKEN_EXPIRES_IN'] ?? '30d';

export interface AccessTokenPayload {
  userId: string;
  role: 'investor' | 'company_admin' | 'admin';
  mobile: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
}

/** Parse token from Authorization header without throwing */
export function parseBearer(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7) || null;
}

/** Return ms until expiry from a JWT (for cache TTL alignment) */
export function tokenTtlMs(token: string): number {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return 0;
    return decoded.exp * 1000 - Date.now();
  } catch {
    return 0;
  }
}
