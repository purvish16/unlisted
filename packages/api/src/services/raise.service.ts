import { prisma } from '../lib/prisma.js';
import { walletService } from './wallet.service.js';

export class RaiseService {
  async getRaise(companyId: string) {
    const raise = await prisma.primaryRaise.findFirst({
      where: { companyId, status: { in: ['active', 'funded'] } },
      include: {
        company: { select: { id: true, name: true, sector: true, logoUrl: true } },
      },
    });
    if (!raise) throw Object.assign(new Error('No active raise found'), { statusCode: 404 });
    return raise;
  }

  async invest(
    investorId: string,
    companyId: string,
    amountPaise: bigint,
  ) {
    const raise = await prisma.primaryRaise.findFirst({
      where: { companyId, status: 'active' },
    });
    if (!raise) throw Object.assign(new Error('No active raise for this company'), { statusCode: 404 });

    const now = new Date();
    if (now < raise.raiseOpensAt || now > raise.raiseClosesAt) {
      throw Object.assign(new Error('Raise is not currently open'), { statusCode: 422 });
    }

    if (amountPaise < raise.minInvestment) {
      throw Object.assign(
        new Error(`Minimum investment is ₹${Number(raise.minInvestment) / 100}`),
        { statusCode: 422 },
      );
    }
    if (amountPaise > raise.maxInvestment) {
      throw Object.assign(
        new Error(`Maximum investment is ₹${Number(raise.maxInvestment) / 100}`),
        { statusCode: 422 },
      );
    }

    const sharesAllocated =
      amountPaise / raise.pricePerShare;

    if (sharesAllocated <= BigInt(0)) {
      throw Object.assign(new Error('Investment too small to allocate shares'), { statusCode: 422 });
    }

    const remainingShares = raise.sharesOffered - raise.sharesAllocated;
    if (sharesAllocated > remainingShares) {
      throw Object.assign(
        new Error(`Only ${remainingShares} shares remain in this raise`),
        { statusCode: 422 },
      );
    }

    // Debit wallet
    await walletService.debit(investorId, amountPaise, 'investment', {
      referenceType: 'raise',
      referenceId: raise.id,
      description: `Primary raise — ${sharesAllocated} shares @ ₹${Number(raise.pricePerShare) / 100}`,
    });

    // Record allocation + update share registry — all atomic
    await prisma.$transaction(async (tx) => {
      await tx.primaryAllocation.create({
        data: {
          raiseId: raise.id,
          investorId,
          companyId,
          amountPaid: amountPaise,
          sharesAllocated,
          pricePerShare: raise.pricePerShare,
          isPaid: true,
          paidAt: new Date(),
        },
      });

      await tx.primaryRaise.update({
        where: { id: raise.id },
        data: {
          raisedAmount: { increment: amountPaise },
          sharesAllocated: { increment: sharesAllocated },
        },
      });

      // Update share registry
      await tx.shareRegistry.upsert({
        where: { companyId_shareholderId: { companyId, shareholderId: investorId } },
        create: {
          companyId,
          shareholderId: investorId,
          sharesHeld: sharesAllocated,
          sharesLocked: BigInt(0),
          averageCostPrice: raise.pricePerShare,
        },
        update: {
          sharesHeld: { increment: sharesAllocated },
          // Update average cost price: (old_total + new_total) / (old_shares + new_shares)
          // Simplified: just increment here; recalculate separately if needed
        },
      });

      // Check if fully funded
      const updated = await tx.primaryRaise.findUnique({
        where: { id: raise.id },
        select: { raisedAmount: true, targetAmount: true },
      });
      if (updated && updated.raisedAmount >= updated.targetAmount) {
        await tx.primaryRaise.update({
          where: { id: raise.id },
          data: { status: 'funded' },
        });
      }
    });

    return { sharesAllocated: Number(sharesAllocated), pricePerShare: Number(raise.pricePerShare) };
  }

  async getMyAllocation(investorId: string, companyId: string) {
    return prisma.primaryAllocation.findMany({
      where: { investorId, companyId },
      include: { raise: true },
    });
  }
}

export const raiseService = new RaiseService();
