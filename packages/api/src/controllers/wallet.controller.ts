import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { walletService } from '../services/wallet.service.js';
import { ok, paginated, parsePagination } from '../lib/response.js';

const addFundsSchema = z.object({
  amountRupees: z.number().positive().min(100).max(1000000),
  paymentMethod: z.enum(['upi', 'netbanking', 'card']).default('upi'),
});

const withdrawSchema = z.object({
  amountRupees: z.number().positive().min(100),
});

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wallet = await walletService.getBalance(req.user!.userId);
    ok(res, {
      availableBalance: Number(wallet.availableBalance),
      escrowBalance: Number(wallet.escrowBalance),
      totalInvested: Number(wallet.totalInvested),
      currency: wallet.currency,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { items, total } = await walletService.getTransactions(req.user!.userId, skip, limit);
    paginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function initiateAddFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amountRupees, paymentMethod } = addFundsSchema.parse(req.body);
    const amountPaise = BigInt(Math.round(amountRupees * 100));

    // In dev: mock Razorpay order creation
    if (process.env['NODE_ENV'] === 'development') {
      const mockOrderId = `rzp_mock_${Date.now()}`;
      ok(res, {
        orderId: mockOrderId,
        amountPaise: Number(amountPaise),
        currency: 'INR',
        keyId: process.env['RAZORPAY_KEY_ID'] ?? 'rzp_test_mock',
        // In dev, immediately credit (for testing)
        devNote: 'Call POST /wallet/add-funds/verify with this orderId to complete',
      });
      return;
    }

    ok(res, { message: 'Razorpay integration pending' });
  } catch (err) {
    next(err);
  }
}

export async function verifyAddFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      orderId: z.string(),
      amountPaise: z.number().int().positive(),
    });
    const { orderId, amountPaise } = schema.parse(req.body);

    // In dev: directly credit the wallet
    if (process.env['NODE_ENV'] === 'development') {
      await walletService.credit(
        req.user!.userId,
        BigInt(amountPaise),
        'deposit',
        { referenceId: orderId, referenceType: 'deposit', description: 'UPI deposit (dev mock)' },
      );
      const wallet = await walletService.getBalance(req.user!.userId);
      ok(res, {
        availableBalance: Number(wallet.availableBalance),
        message: 'Funds added successfully',
      });
      return;
    }

    ok(res, { message: 'Razorpay verification pending' });
  } catch (err) {
    next(err);
  }
}

export async function initiateWithdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amountRupees } = withdrawSchema.parse(req.body);
    const amountPaise = BigInt(Math.round(amountRupees * 100));

    // Check balance
    const wallet = await walletService.getBalance(req.user!.userId);
    if (wallet.availableBalance < amountPaise) {
      ok(res, { error: 'Insufficient balance' });
      return;
    }

    // In dev: mock withdrawal
    if (process.env['NODE_ENV'] === 'development') {
      ok(res, {
        withdrawalId: `wdl_mock_${Date.now()}`,
        amountPaise: Number(amountPaise),
        devNote: 'Call POST /wallet/withdraw/verify to complete',
      });
      return;
    }

    ok(res, { message: 'Cashfree payout integration pending' });
  } catch (err) {
    next(err);
  }
}

export async function verifyWithdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      withdrawalId: z.string(),
      amountPaise: z.number().int().positive(),
    });
    const { withdrawalId, amountPaise } = schema.parse(req.body);

    if (process.env['NODE_ENV'] === 'development') {
      await walletService.debit(
        req.user!.userId,
        BigInt(amountPaise),
        'withdrawal',
        { referenceId: withdrawalId, referenceType: 'withdrawal', description: 'Bank withdrawal (dev mock)' },
      );
      const wallet = await walletService.getBalance(req.user!.userId);
      ok(res, {
        availableBalance: Number(wallet.availableBalance),
        message: 'Withdrawal successful',
      });
      return;
    }

    ok(res, { message: 'Cashfree payout integration pending' });
  } catch (err) {
    next(err);
  }
}
