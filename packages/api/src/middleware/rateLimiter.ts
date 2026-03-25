import rateLimit from 'express-rate-limit';

/** Aggressive limit for auth endpoints (OTP send/verify) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** OTP send — even stricter: 3 per 10 minutes per IP */
export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many OTP requests. Try again in 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API limiter */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, error: 'Rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Financial mutations — order placement, wallet operations */
export const financialLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many financial requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
