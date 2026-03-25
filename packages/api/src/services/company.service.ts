import { prisma } from '../lib/prisma.js';
import type { ListingStatus, Prisma } from '@prisma/client';

export class CompanyService {
  /** List companies with filters, sorting, search, pagination */
  async list(opts: {
    search?: string;
    sector?: string;
    status?: ListingStatus;
    skip: number;
    take: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const where: Prisma.CompanyWhereInput = {
      listingStatus: opts.status ?? { in: ['live', 'approved'] },
      ...(opts.search && {
        OR: [
          { name: { contains: opts.search, mode: 'insensitive' } },
          { sector: { contains: opts.search, mode: 'insensitive' } },
          { description: { contains: opts.search, mode: 'insensitive' } },
        ],
      }),
      ...(opts.sector && { sector: { equals: opts.sector, mode: 'insensitive' } }),
    };

    const orderBy: Prisma.CompanyOrderByWithRelationInput = (() => {
      switch (opts.sortBy) {
        case 'price': return { lastTradedPrice: opts.sortDir ?? 'desc' };
        case 'score': return { businessHealthScore: opts.sortDir ?? 'desc' };
        case 'name': return { name: opts.sortDir ?? 'asc' };
        default: return { goLiveAt: 'desc' };
      }
    })();

    const [items, total] = await prisma.$transaction([
      prisma.company.findMany({ where, orderBy, skip: opts.skip, take: opts.take }),
      prisma.company.count({ where }),
    ]);

    return { items, total };
  }

  /** Full company detail with active primary raise */
  async getById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        primaryRaises: {
          where: { status: 'active' },
          take: 1,
        },
        updates: {
          where: { isPublished: true },
          orderBy: { publishedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!company) throw Object.assign(new Error('Company not found'), { statusCode: 404 });
    return company;
  }

  /** Get trending companies — highest volume in last 24h */
  async getTrending(take = 4) {
    return prisma.company.findMany({
      where: { listingStatus: 'live' },
      orderBy: { volume24h: 'desc' },
      take,
    });
  }

  /** Get distinct sectors for filter UI */
  async getSectors(): Promise<string[]> {
    const result = await prisma.company.findMany({
      where: { listingStatus: { in: ['live', 'approved'] }, sector: { not: null } },
      select: { sector: true },
      distinct: ['sector'],
    });
    return result.map((r) => r.sector).filter((s): s is string => s !== null);
  }

  /** Get order book (aggregated bids and asks) */
  async getOrderBook(companyId: string) {
    const [bids, asks] = await prisma.$transaction([
      prisma.order.groupBy({
        by: ['pricePerShare'],
        where: { companyId, orderType: 'buy', status: 'open' },
        _sum: { remainingQuantity: true },
        _count: { id: true },
        orderBy: { pricePerShare: 'desc' },
        take: 10,
      }),
      prisma.order.groupBy({
        by: ['pricePerShare'],
        where: { companyId, orderType: 'sell', status: 'open' },
        _sum: { remainingQuantity: true },
        _count: { id: true },
        orderBy: { pricePerShare: 'asc' },
        take: 10,
      }),
    ]);

    return {
      bids: bids.map((b) => ({
        price: Number(b.pricePerShare ?? 0),
        quantity: Number(b._sum.remainingQuantity ?? 0),
        orderCount: b._count.id,
      })),
      asks: asks.map((a) => ({
        price: Number(a.pricePerShare ?? 0),
        quantity: Number(a._sum.remainingQuantity ?? 0),
        orderCount: a._count.id,
      })),
    };
  }

  /** Get recent trades for a company */
  async getRecentTrades(companyId: string, take = 20) {
    return prisma.trade.findMany({
      where: { companyId },
      orderBy: { tradedAt: 'desc' },
      take,
      select: {
        id: true,
        quantity: true,
        pricePerShare: true,
        totalAmount: true,
        tradedAt: true,
      },
    });
  }
}

export const companyService = new CompanyService();
