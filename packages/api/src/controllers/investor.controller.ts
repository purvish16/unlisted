import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { investorService } from '../services/investor.service.js';
import { ok, parsePagination } from '../lib/response.js';

const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
});

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await investorService.getProfile(req.user!.userId);
    ok(res, profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    const result = await investorService.updateProfile(req.user!.userId, data);
    ok(res, result, 'Profile updated');
  } catch (err) {
    next(err);
  }
}

export async function getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { portfolioService } = await import('../services/portfolio.service.js');
    const result = await portfolioService.getPortfolio(req.user!.userId);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getHoldings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { portfolioService } = await import('../services/portfolio.service.js');
    const result = await portfolioService.getPortfolio(req.user!.userId);
    ok(res, result.holdings);
  } catch (err) {
    next(err);
  }
}

export async function getHoldingByCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { portfolioService } = await import('../services/portfolio.service.js');
    const result = await portfolioService.getHolding(req.user!.userId, req.params['companyId']!);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}
