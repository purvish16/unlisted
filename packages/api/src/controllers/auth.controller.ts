import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { ok, badRequest } from '../lib/response.js';

const sendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
});

const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mobile } = sendOtpSchema.parse(req.body);
    const result = await authService.sendOtp(mobile);
    ok(res, result, 'OTP sent successfully');
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mobile, otp } = verifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(mobile, otp);
    ok(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = refreshSchema.parse(req.body);
    const result = await authService.refreshToken(token);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = logoutSchema.safeParse(req.body);
    if (parsed.success) {
      await authService.logout(parsed.data.refreshToken);
    }
    ok(res, null, 'Logged out');
  } catch (err) {
    next(err);
  }
}
