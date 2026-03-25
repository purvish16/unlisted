import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service.js';
import { ok, paginated, parsePagination } from '../lib/response.js';

const placeOrderSchema = z.object({
  companyId: z.string().uuid(),
  orderType: z.enum(['buy', 'sell']),
  orderMode: z.enum(['market', 'limit']),
  quantity: z.number().int().positive(),
  pricePerShare: z.number().positive().optional(),
});

export async function placeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = placeOrderSchema.parse(req.body);
    const order = await orderService.placeOrder({
      investorId: req.user!.userId,
      ...data,
    });
    ok(res, order, 'Order placed successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await orderService.cancelOrder(req.params['id']!, req.user!.userId);
    ok(res, null, 'Order cancelled');
  } catch (err) {
    next(err);
  }
}

export async function getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { items, total } = await orderService.getMyOrders(req.user!.userId, skip, limit);
    paginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { prisma } = await import('../lib/prisma.js');
    const order = await prisma.order.findFirst({
      where: { id: req.params['id'], investorId: req.user!.userId },
      include: { company: { select: { name: true, sector: true } } },
    });
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    ok(res, order);
  } catch (err) {
    next(err);
  }
}
