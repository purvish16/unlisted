import { prisma } from '../lib/prisma.js';
import type { TransactionType } from '@prisma/client';

/**
 * All wallet mutations use PostgreSQL transactions to ensure atomicity.
 * Amounts are always in PAISE (BigInt).
 * We implement a simple double-entry pattern:
 *   - Every movement records balanceBefore + balanceAfter
 *   - Money is never created or destroyed — only moved between buckets
 */
export class WalletService {
  /** Get wallet balance for a user */
  async getBalance(userId: string) {
    const wallet = await prisma.investorWallet.findUnique({ where: { userId } });
    if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
    return wallet;
  }

  /**
   * Credit available balance (deposit, sale proceeds, refund, dividend).
   * Creates a transaction ledger entry.
   */
  async credit(
    userId: string,
    amountPaise: bigint,
    type: TransactionType,
    opts: { referenceId?: string; referenceType?: string; description?: string },
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.investorWallet.findUnique({
        where: { userId },
        select: { availableBalance: true },
      });
      if (!wallet) throw new Error('Wallet not found');

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore + amountPaise;

      await tx.investorWallet.update({
        where: { userId },
        data: { availableBalance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          userId,
          transactionType: type,
          amount: amountPaise,
          balanceBefore,
          balanceAfter,
          referenceId: opts.referenceId,
          referenceType: opts.referenceType,
          description: opts.description,
          status: 'completed',
        },
      });
    });
  }

  /**
   * Debit available balance (investment, withdrawal, fee).
   * Throws if insufficient funds.
   */
  async debit(
    userId: string,
    amountPaise: bigint,
    type: TransactionType,
    opts: { referenceId?: string; referenceType?: string; description?: string },
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.investorWallet.findUnique({
        where: { userId },
        select: { availableBalance: true },
      });
      if (!wallet) throw new Error('Wallet not found');
      if (wallet.availableBalance < amountPaise) {
        throw Object.assign(new Error('Insufficient wallet balance'), { statusCode: 422 });
      }

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore - amountPaise;

      await tx.investorWallet.update({
        where: { userId },
        data: { availableBalance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          userId,
          transactionType: type,
          amount: amountPaise,
          balanceBefore,
          balanceAfter,
          referenceId: opts.referenceId,
          referenceType: opts.referenceType,
          description: opts.description,
          status: 'completed',
        },
      });
    });
  }

  /**
   * Move funds from available → escrow (when buyer places an order).
   */
  async moveToEscrow(userId: string, amountPaise: bigint, orderId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.investorWallet.findUnique({
        where: { userId },
        select: { availableBalance: true, escrowBalance: true },
      });
      if (!wallet) throw new Error('Wallet not found');
      if (wallet.availableBalance < amountPaise) {
        throw Object.assign(new Error('Insufficient balance to place order'), { statusCode: 422 });
      }

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore - amountPaise;

      await tx.investorWallet.update({
        where: { userId },
        data: {
          availableBalance: balanceAfter,
          escrowBalance: wallet.escrowBalance + amountPaise,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          transactionType: 'investment',
          amount: amountPaise,
          balanceBefore,
          balanceAfter,
          referenceId: orderId,
          referenceType: 'order',
          description: 'Funds locked for buy order',
          status: 'completed',
        },
      });
    });
  }

  /**
   * Release funds from escrow → available (order cancelled / overpay refund).
   */
  async releaseFromEscrow(
    userId: string,
    amountPaise: bigint,
    referenceId: string,
    description: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.investorWallet.findUnique({
        where: { userId },
        select: { availableBalance: true, escrowBalance: true },
      });
      if (!wallet) throw new Error('Wallet not found');

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore + amountPaise;

      await tx.investorWallet.update({
        where: { userId },
        data: {
          availableBalance: balanceAfter,
          escrowBalance: wallet.escrowBalance - amountPaise,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          transactionType: 'refund',
          amount: amountPaise,
          balanceBefore,
          balanceAfter,
          referenceId,
          referenceType: 'order',
          description,
          status: 'completed',
        },
      });
    });
  }

  /** Get paginated transaction history */
  async getTransactions(userId: string, skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);
    return { items, total };
  }
}

export const walletService = new WalletService();
