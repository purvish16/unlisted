import { prisma } from '../lib/prisma.js';

export class PortfolioService {
  async getPortfolio(userId: string) {
    const holdings = await prisma.shareRegistry.findMany({
      where: { shareholderId: userId, sharesHeld: { gt: BigInt(0) } },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            sector: true,
            logoUrl: true,
            lastTradedPrice: true,
            listingStatus: true,
          },
        },
      },
    });

    let totalInvested = BigInt(0);
    let totalCurrentValue = BigInt(0);

    const enriched = holdings.map((h) => {
      const cmp = h.company.lastTradedPrice ?? h.averageCostPrice;
      const investedValue = h.averageCostPrice * h.sharesHeld;
      const currentValue = cmp * h.sharesHeld;
      const pnl = currentValue - investedValue;
      const pnlPct = investedValue > BigInt(0)
        ? (Number(pnl) / Number(investedValue)) * 100
        : 0;

      totalInvested += investedValue;
      totalCurrentValue += currentValue;

      return {
        companyId: h.companyId,
        companyName: h.company.name,
        companySector: h.company.sector,
        companyLogoUrl: h.company.logoUrl,
        sharesHeld: Number(h.sharesHeld),
        sharesLocked: Number(h.sharesLocked),
        averageCostPrice: Number(h.averageCostPrice),
        currentMarketPrice: Number(cmp),
        investedValue: Number(investedValue),
        currentValue: Number(currentValue),
        pnl: Number(pnl),
        pnlPct: parseFloat(pnlPct.toFixed(2)),
      };
    });

    const totalReturns = totalCurrentValue - totalInvested;
    const totalReturnsPct =
      totalInvested > BigInt(0)
        ? parseFloat(((Number(totalReturns) / Number(totalInvested)) * 100).toFixed(2))
        : 0;

    return {
      totalValue: Number(totalCurrentValue),
      totalInvested: Number(totalInvested),
      totalReturns: Number(totalReturns),
      totalReturnsPct,
      holdings: enriched,
    };
  }

  async getHolding(userId: string, companyId: string) {
    const entry = await prisma.shareRegistry.findUnique({
      where: { companyId_shareholderId: { companyId, shareholderId: userId } },
      include: { company: true },
    });
    if (!entry) throw Object.assign(new Error('No holding found'), { statusCode: 404 });
    return entry;
  }

  async getTrades(userId: string, skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.trade.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        orderBy: { tradedAt: 'desc' },
        skip,
        take,
        include: { company: { select: { id: true, name: true, sector: true } } },
      }),
      prisma.trade.count({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      }),
    ]);
    return { items, total };
  }
}

export const portfolioService = new PortfolioService();
