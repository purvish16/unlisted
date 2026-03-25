import Redis from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: false,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

// ── Key helpers ───────────────────────────────────────────────────────────────

export const RedisKeys = {
  otp: (mobile: string) => `otp:${mobile}`,
  otpAttempts: (mobile: string) => `otp_attempts:${mobile}`,
  orderBook: (companyId: string) => `orderbook:${companyId}`,
  priceCache: (companyId: string) => `price:${companyId}`,
  session: (userId: string) => `session:${userId}`,
  rateLimit: (ip: string, route: string) => `rl:${route}:${ip}`,
} as const;

export const OTP_TTL_SECONDS = 300; // 5 minutes
export const OTP_ATTEMPT_WINDOW = 3600; // 1 hour
export const MAX_OTP_ATTEMPTS = 5;
