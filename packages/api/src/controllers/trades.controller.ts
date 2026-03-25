import type { Request, Response, NextFunction } from 'express';
import { portfolioService } from '../services/portfolio.service.js';
import { ok, paginated, parsePagination, notFound } from '../lib/response.js';
import { prisma } from '../lib/prisma.js';

export async function getMyTrades(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { items, total } = await portfolioService.getTrades(req.user!.userId, skip, limit);
    paginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getTrade(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const trade = await prisma.trade.findFirst({
      where: {
        id: req.params['id'],
        OR: [{ buyerId: req.user!.userId }, { sellerId: req.user!.userId }],
      },
      include: {
        company: { select: { id: true, name: true, sector: true } },
        buyOrder: { select: { id: true, orderMode: true } },
        sellOrder: { select: { id: true, orderMode: true } },
      },
    });
    if (!trade) return notFound(res, 'Trade not found');
    ok(res, trade);
  } catch (err) {
    next(err);
  }
}

export async function signTrade(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const trade = await prisma.trade.findFirst({
      where: {
        id: req.params['id'],
        OR: [{ buyerId: req.user!.userId }, { sellerId: req.user!.userId }],
        settlementStatus: 'pending',
      },
    });
    if (!trade) return notFound(res, 'Trade not found or already signed');

    const isBuyer = trade.buyerId === req.user!.userId;
    await prisma.trade.update({
      where: { id: trade.id },
      data: isBuyer
        ? { buyerSignedAt: new Date() }
        : { sellerSignedAt: new Date() },
    });

    // Check if both have signed → queue settlement
    const updated = await prisma.trade.findUnique({ where: { id: trade.id } });
    if (updated?.buyerSignedAt && updated?.sellerSignedAt) {
      const { settlementQueue } = await import('../jobs/index.js');
      await settlementQueue.add({ tradeId: trade.id }, { delay: 0 });
      await prisma.trade.update({
        where: { id: trade.id },
        data: { settlementStatus: 'signed' },
      });
    }

    ok(res, { signed: true }, 'Trade signed successfully');
  } catch (err) {
    next(err);
  }
}
