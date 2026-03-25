import type { Request, Response, NextFunction } from 'express';
import { ok, notFound } from '../lib/response.js';
import { prisma } from '../lib/prisma.js';

export async function getCompanyHoldings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params as { companyId: string };
    const holdings = await prisma.shareRegistry.findMany({
      where: { companyId, sharesHeld: { gt: BigInt(0) } },
      include: {
        shareholder: { select: { id: true, fullName: true, mobile: true } },
      },
      orderBy: { sharesHeld: 'desc' },
    });
    ok(res, holdings);
  } catch (err) {
    next(err);
  }
}

export async function getCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cert = await prisma.shareCertificate.findFirst({
      where: { id: req.params['id'], holderId: req.user!.userId },
      include: { company: { select: { name: true } } },
    });
    if (!cert) return notFound(res, 'Certificate not found');
    ok(res, cert);
  } catch (err) {
    next(err);
  }
}

export async function getMyCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const certs = await prisma.shareCertificate.findMany({
      where: { holderId: req.user!.userId, isCancelled: false },
      include: { company: { select: { id: true, name: true, sector: true } } },
      orderBy: { issueDate: 'desc' },
    });
    ok(res, certs);
  } catch (err) {
    next(err);
  }
}
