import { prisma } from '../lib/prisma.js';
import { walletService } from './wallet.service.js';
import { getIO } from '../websocket/index.js';
import type { OrderMode, OrderType } from '@prisma/client';
import { logger } from '../lib/logger.js';

const PLATFORM_FEE_BPS = parseInt(process.env['PLATFORM_FEE_BPS'] ?? '200', 10);

export class OrderService {
  /**
   * Place a buy or sell order.
   *
   * Buy order:  funds moved to escrow immediately (available → escrow)
   * Sell order: shares marked as locked in registry
   *
   * After placement, attempt matching against the opposite side.
   */
  async placeOrder(opts: {
    investorId: string;
    companyId: string;
    orderType: OrderType;
    orderMode: OrderMode;
    quantity: number;
    pricePerShare?: number; // null/undefined for market orders
  }) {
    const { investorId, companyId, orderType, orderMode, quantity, pricePerShare } = opts;

    if (quantity <= 0) {
      throw Object.assign(new Error('Quantity must be greater than zero'), { statusCode: 400 });
    }

    if (orderMode === 'limit' && !pricePerShare) {
      throw Object.assign(new Error('Price required for limit orders'), { statusCode: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.listingStatus !== 'live') {
      throw Object.assign(new Error('Company is not available for trading'), { statusCode: 422 });
    }

    const pricePaise = pricePerShare ? BigInt(Math.round(pricePerShare * 100)) : null;
    const totalCost = pricePaise ? pricePaise * BigInt(quantity) : BigInt(0);

    if (orderType === 'buy' && pricePaise) {
      // Lock funds in escrow
      await walletService.moveToEscrow(investorId, totalCost, 'pending');
    }

    if (orderType === 'sell') {
      // Check the investor actually holds enough shares
      const registry = await prisma.shareRegistry.findUnique({
        where: { companyId_shareholderId: { companyId, shareholderId: investorId } },
      });
      const available = (registry?.sharesHeld ?? BigInt(0)) - (registry?.sharesLocked ?? BigInt(0));
      if (available < BigInt(quantity)) {
        throw Object.assign(
          new Error(`Insufficient shares. You have ${available} unlocked shares.`),
          { statusCode: 422 },
        );
      }
      // Lock shares
      await prisma.shareRegistry.update({
        where: { companyId_shareholderId: { companyId, shareholderId: investorId } },
        data: { sharesLocked: { increment: BigInt(quantity) } },
      });
    }

    const order = await prisma.order.create({
      data: {
        investorId,
        companyId,
        orderType,
        orderMode,
        quantity: BigInt(quantity),
        filledQuantity: BigInt(0),
        remainingQuantity: BigInt(quantity),
        pricePerShare: pricePaise,
        status: 'open',
      },
    });

    // Fix up escrow reference now we have orderId
    if (orderType === 'buy' && pricePaise) {
      await prisma.transaction.updateMany({
        where: {
          userId: investorId,
          referenceId: 'pending',
          referenceType: 'order',
        },
        data: { referenceId: order.id },
      });
    }

    // Attempt matching — fire and forget (non-blocking)
    this.matchOrders(companyId).catch((err: unknown) =>
      logger.error('[OrderService] matchOrders error', { error: err }),
    );

    return order;
  }

  /**
   * Simple price-time priority matching engine.
   * Matches the best ask (lowest sell) against the best bid (highest buy).
   * Runs after every new order.
   */
  async matchOrders(companyId: string): Promise<void> {
    // We run in a loop until no more matches
    while (true) {
      const bestBid = await prisma.order.findFirst({
        where: { companyId, orderType: 'buy', status: { in: ['open', 'partially_filled'] } },
        orderBy: [{ pricePerShare: 'desc' }, { placedAt: 'asc' }],
      });

      const bestAsk = await prisma.order.findFirst({
        where: { companyId, orderType: 'sell', status: { in: ['open', 'partially_filled'] } },
        orderBy: [{ pricePerShare: 'asc' }, { placedAt: 'asc' }],
      });

      if (!bestBid || !bestAsk) break;

      // Market orders always match; limit orders need price overlap
      const bidPrice = bestBid.pricePerShare;
      const askPrice = bestAsk.pricePerShare;

      if (bidPrice !== null && askPrice !== null && bidPrice < askPrice) break;

      // Trade price = sell order price (price discovery)
      const tradePrice = askPrice ?? bidPrice ?? BigInt(0);
      const tradeQty = bestBid.remainingQuantity < bestAsk.remainingQuantity
        ? bestBid.remainingQuantity
        : bestAsk.remainingQuantity;

      await this.executeTrade({
        buyOrder: bestBid,
        sellOrder: bestAsk,
        quantity: tradeQty,
        pricePerShare: tradePrice,
        companyId,
      });
    }
  }

  /** Execute a matched trade atomically */
  private async executeTrade(opts: {
    buyOrder: { id: string; investorId: string; pricePerShare: bigint | null; remainingQuantity: bigint };
    sellOrder: { id: string; investorId: string; pricePerShare: bigint | null; remainingQuantity: bigint };
    quantity: bigint;
    pricePerShare: bigint;
    companyId: string;
  }) {
    const { buyOrder, sellOrder, quantity, pricePerShare, companyId } = opts;
    const totalAmount = pricePerShare * quantity;
    const platformFee = (totalAmount * BigInt(PLATFORM_FEE_BPS)) / BigInt(10000);
    const netToSeller = totalAmount - platformFee;

    await prisma.$transaction(async (tx) => {
      // 1. Create trade record
      const trade = await tx.trade.create({
        data: {
          buyOrderId: buyOrder.id,
          sellOrderId: sellOrder.id,
          companyId,
          buyerId: buyOrder.investorId,
          sellerId: sellOrder.investorId,
          quantity,
          pricePerShare,
          totalAmount,
          platformFee,
          netToSeller,
          settlementStatus: 'pending',
        },
      });

      // 2. Update order fill quantities
      const newBuyRemaining = buyOrder.remainingQuantity - quantity;
      const newSellRemaining = sellOrder.remainingQuantity - quantity;

      await tx.order.update({
        where: { id: buyOrder.id },
        data: {
          filledQuantity: { increment: quantity },
          remainingQuantity: newBuyRemaining,
          status: newBuyRemaining === BigInt(0) ? 'filled' : 'partially_filled',
          filledAt: newBuyRemaining === BigInt(0) ? new Date() : undefined,
        },
      });

      await tx.order.update({
        where: { id: sellOrder.id },
        data: {
          filledQuantity: { increment: quantity },
          remainingQuantity: newSellRemaining,
          status: newSellRemaining === BigInt(0) ? 'filled' : 'partially_filled',
          filledAt: newSellRemaining === BigInt(0) ? new Date() : undefined,
        },
      });

      // 3. Transfer shares in registry (buyer gains, seller loses)
      await tx.shareRegistry.upsert({
        where: { companyId_shareholderId: { companyId, shareholderId: buyOrder.investorId } },
        create: {
          companyId,
          shareholderId: buyOrder.investorId,
          sharesHeld: quantity,
          sharesLocked: BigInt(0),
          averageCostPrice: pricePerShare,
        },
        update: {
          sharesHeld: { increment: quantity },
        },
      });

      await tx.shareRegistry.update({
        where: { companyId_shareholderId: { companyId, shareholderId: sellOrder.investorId } },
        data: {
          sharesHeld: { decrement: quantity },
          sharesLocked: { decrement: quantity },
        },
      });

      // 4. Move funds: escrow → seller (minus fee)
      const buyerWallet = await tx.investorWallet.findUnique({
        where: { userId: buyOrder.investorId },
        select: { escrowBalance: true, availableBalance: true },
      });
      if (buyerWallet) {
        await tx.investorWallet.update({
          where: { userId: buyOrder.investorId },
          data: { escrowBalance: { decrement: totalAmount } },
        });
      }

      const sellerWallet = await tx.investorWallet.findUnique({
        where: { userId: sellOrder.investorId },
        select: { availableBalance: true },
      });
      if (sellerWallet) {
        await tx.investorWallet.update({
          where: { userId: sellOrder.investorId },
          data: { availableBalance: { increment: netToSeller } },
        });
      }

      // 5. Wallet ledger entries
      await tx.transaction.create({
        data: {
          userId: sellOrder.investorId,
          transactionType: 'sale',
          amount: netToSeller,
          balanceBefore: sellerWallet?.availableBalance ?? BigInt(0),
          balanceAfter: (sellerWallet?.availableBalance ?? BigInt(0)) + netToSeller,
          referenceId: trade.id,
          referenceType: 'trade',
          description: `Sale of ${quantity} shares @ ₹${Number(pricePerShare) / 100}`,
          status: 'completed',
        },
      });

      // 6. Update company LTP
      await tx.company.update({
        where: { id: companyId },
        data: {
          lastTradedPrice: pricePerShare,
          priceChange24h: pricePerShare - (await this.getOpenPrice(tx, companyId, pricePerShare)),
          volume24h: { increment: quantity },
        },
      });

      return trade;
    });

    // 7. Emit real-time events
    try {
      const io = getIO();
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        io.to(`company:${companyId}`).emit('price:update', {
          companyId,
          lastTradedPrice: Number(pricePerShare),
          volume: Number(company.volume24h),
        });
        io.to(`company:${companyId}`).emit('orderbook:update', { companyId });
        io.to(`user:${buyOrder.investorId}`).emit('trade:matched', { companyId, role: 'buyer' });
        io.to(`user:${sellOrder.investorId}`).emit('trade:matched', { companyId, role: 'seller' });
      }
    } catch {
      // WebSocket not critical — don't fail the trade
    }
  }

  private async getOpenPrice(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    companyId: string,
    fallback: bigint,
  ): Promise<bigint> {
    const company = await tx.company.findUnique({
      where: { id: companyId },
      select: { lastTradedPrice: true },
    });
    return company?.lastTradedPrice ?? fallback;
  }

  /** Cancel an open order */
  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    if (order.investorId !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    if (order.status !== 'open' && order.status !== 'partially_filled') {
      throw Object.assign(new Error('Order cannot be cancelled'), { statusCode: 422 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });

      if (order.orderType === 'buy' && order.pricePerShare) {
        // Refund remaining escrow to available
        const refundAmount = order.remainingQuantity * order.pricePerShare;
        const wallet = await tx.investorWallet.findUnique({ where: { userId } });
        if (wallet) {
          await tx.investorWallet.update({
            where: { userId },
            data: {
              escrowBalance: { decrement: refundAmount },
              availableBalance: { increment: refundAmount },
            },
          });
          await tx.transaction.create({
            data: {
              userId,
              transactionType: 'refund',
              amount: refundAmount,
              balanceBefore: wallet.availableBalance,
              balanceAfter: wallet.availableBalance + refundAmount,
              referenceId: orderId,
              referenceType: 'order',
              description: 'Buy order cancelled — funds returned',
              status: 'completed',
            },
          });
        }
      }

      if (order.orderType === 'sell') {
        // Unlock shares
        await tx.shareRegistry.update({
          where: {
            companyId_shareholderId: {
              companyId: order.companyId,
              shareholderId: userId,
            },
          },
          data: { sharesLocked: { decrement: order.remainingQuantity } },
        });
      }
    });
  }

  /** Get investor's orders */
  async getMyOrders(userId: string, skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { investorId: userId },
        orderBy: { placedAt: 'desc' },
        skip,
        take,
        include: { company: { select: { name: true, sector: true } } },
      }),
      prisma.order.count({ where: { investorId: userId } }),
    ]);
    return { items, total };
  }
}

export const orderService = new OrderService();
