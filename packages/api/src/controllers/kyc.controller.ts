import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { kycService } from '../services/kyc.service.js';
import { ok } from '../lib/response.js';

const panSchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

const bankSchema = z.object({
  accountNumber: z.string().min(9).max(18).regex(/^\d+$/),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC'),
  accountHolderName: z.string().min(2).max(100),
});

const aadhaarCompleteSchema = z.object({
  requestId: z.string().min(1),
});

export async function getKycStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kycService.getStatus(req.user!.userId);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifyPan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = panSchema.parse(req.body);
    const result = await kycService.verifyPan(req.user!.userId, data);
    ok(res, result, 'PAN verified successfully');
  } catch (err) {
    next(err);
  }
}

export async function verifyBank(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = bankSchema.parse(req.body);
    const result = await kycService.verifyBank(req.user!.userId, data);
    ok(res, result, 'Bank account verified');
  } catch (err) {
    next(err);
  }
}

export async function initiateAadhaar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kycService.initiateAadhaar(req.user!.userId);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function completeAadhaar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { requestId } = aadhaarCompleteSchema.parse(req.body);
    const result = await kycService.completeAadhaar(req.user!.userId, requestId);
    ok(res, result, 'Aadhaar eKYC complete');
  } catch (err) {
    next(err);
  }
}
