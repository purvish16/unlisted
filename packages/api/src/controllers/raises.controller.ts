import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { raiseService } from '../services/raise.service.js';
import { ok } from '../lib/response.js';

const investSchema = z.object({
  amountRupees: z.number().positive(),
});

export async function getRaise(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raise = await raiseService.getRaise(req.params['companyId']!);
    ok(res, raise);
  } catch (err) {
    next(err);
  }
}

export async function invest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amountRupees } = investSchema.parse(req.body);
    const amountPaise = BigInt(Math.round(amountRupees * 100));
    const result = await raiseService.invest(
      req.user!.userId,
      req.params['companyId']!,
      amountPaise,
    );
    ok(res, result, 'Investment successful', 201);
  } catch (err) {
    next(err);
  }
}

export async function getMyAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allocations = await raiseService.getMyAllocation(
      req.user!.userId,
      req.params['companyId']!,
    );
    ok(res, allocations);
  } catch (err) {
    next(err);
  }
}
