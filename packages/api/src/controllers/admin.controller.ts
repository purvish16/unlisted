import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from '../services/admin.service.js';
import { ok, paginated, parsePagination } from '../lib/response.js';
import type { ListingStatus, VerificationStatus } from '@prisma/client';

const reviewSchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'live', 'suspended', 'delisted']),
  notes: z.string().optional(),
});

const verifyDocSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'action_required']),
  rejectionReason: z.string().optional(),
});

const healthScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
});

export async function getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { items, total } = await adminService.getApplications(skip, limit);
    paginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function reviewApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, notes } = reviewSchema.parse(req.body);
    const result = await adminService.reviewApplication(
      req.params['id']!,
      req.user!.userId,
      status as ListingStatus,
      notes,
    );
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function approveApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await adminService.reviewApplication(
      req.params['id']!,
      req.user!.userId,
      'approved',
    );
    ok(res, result, 'Application approved');
  } catch (err) {
    next(err);
  }
}

export async function rejectApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { notes } = z.object({ notes: z.string().optional() }).parse(req.body);
    const result = await adminService.reviewApplication(
      req.params['id']!,
      req.user!.userId,
      'delisted',
      notes,
    );
    ok(res, result, 'Application rejected');
  } catch (err) {
    next(err);
  }
}

export async function goLive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await adminService.goLive(req.params['id']!, req.user!.userId);
    ok(res, result, 'Company is now live');
  } catch (err) {
    next(err);
  }
}

export async function verifyDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, rejectionReason } = verifyDocSchema.parse(req.body);
    const result = await adminService.verifyDocument(
      req.params['id']!,
      req.user!.userId,
      status as VerificationStatus,
      rejectionReason,
    );
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { search } = req.query as Record<string, string>;
    const { items, total } = await adminService.getUsers(skip, limit, search);
    paginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getAllTrades(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { items, total } = await adminService.getAllTrades(skip, limit);
    paginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getPlatformMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const metrics = await adminService.getPlatformMetrics();
    ok(res, metrics);
  } catch (err) {
    next(err);
  }
}

export async function setHealthScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { score } = healthScoreSchema.parse(req.body);
    const company = await adminService.setHealthScore(req.params['id']!, score, req.user!.userId);
    ok(res, company, 'Health score updated');
  } catch (err) {
    next(err);
  }
}
