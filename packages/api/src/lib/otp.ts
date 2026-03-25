import { redis, RedisKeys, OTP_TTL_SECONDS, OTP_ATTEMPT_WINDOW, MAX_OTP_ATTEMPTS } from './redis.js';
import { logger } from './logger.js';

/** Generate a 6-digit OTP */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Store OTP in Redis with TTL */
export async function storeOtp(mobile: string, otp: string): Promise<void> {
  await redis.setex(RedisKeys.otp(mobile), OTP_TTL_SECONDS, otp);
}

/** Verify OTP from Redis — returns true and deletes if valid */
export async function verifyOtp(mobile: string, otp: string): Promise<boolean> {
  const stored = await redis.get(RedisKeys.otp(mobile));
  if (!stored || stored !== otp) return false;
  await redis.del(RedisKeys.otp(mobile));
  return true;
}

/** Check and increment attempt counter. Returns false if limit exceeded. */
export async function checkOtpAttempts(mobile: string): Promise<boolean> {
  const key = RedisKeys.otpAttempts(mobile);
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, OTP_ATTEMPT_WINDOW);
  }
  return attempts <= MAX_OTP_ATTEMPTS;
}

/** Send OTP via Twilio (or log in dev) */
export async function sendOtp(mobile: string, otp: string): Promise<void> {
  if (process.env['NODE_ENV'] === 'development') {
    // In dev, just log the OTP — no Twilio call
    logger.info(`[OTP] ${mobile} → ${otp} (dev mode, not sent via SMS)`);
    return;
  }

  // Production: use Twilio
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];
  const fromNumber = process.env['TWILIO_FROM_NUMBER'];

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  // Dynamic import to avoid loading Twilio in dev
  const twilio = await import('twilio');
  const client = twilio.default(accountSid, authToken);

  await client.messages.create({
    body: `Your Unlisted OTP is: ${otp}. Valid for 5 minutes. Do not share.`,
    from: fromNumber,
    to: `+91${mobile}`,
  });
}
