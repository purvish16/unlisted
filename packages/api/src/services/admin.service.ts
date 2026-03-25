import { prisma } from '../lib/prisma.js';
import type { ListingStatus, VerificationStatus } from '@prisma/client';

export class AdminService {
  /** Pending + under_review applications */
  async getApplications(skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.company.findMany({
        where: { listingStatus: { in: ['pending', 'under_review', 'approved'] } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { members: { include: { user: { select: { fullName: true, mobile: true, email: true } } } } },
      }),
      prisma.company.count({
        where: { listingStatus: { in: ['pending', 'under_review', 'approved'] } },
      }),
    ]);
    return { items, total };
  }

  async reviewApplication(companyId: string, adminId: string, status: ListingStatus, notes?: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw Object.assign(new Error('Company not found'), { statusCode: 404 });

    await prisma.company.update({
      where: { id: companyId },
      data: { listingStatus: status },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `company.${status}`,
        entityType: 'company',
        entityId: companyId,
        metadata: { notes, previousStatus: company.listingStatus },
      },
    });

    return { companyId, status };
  }

  async goLive(companyId: string, adminId: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw Object.assign(new Error('Company not found'), { statusCode: 404 });
    if (company.listingStatus !== 'approved') {
      throw Object.assign(new Error('Company must be approved before going live'), { statusCode: 422 });
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { listingStatus: 'live', goLiveAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'company.go_live',
        entityType: 'company',
        entityId: companyId,
        metadata: {},
      },
    });

    return { companyId, status: 'live' };
  }

  async verifyDocument(
    documentId: string,
    adminId: string,
    status: VerificationStatus,
    rejectionReason?: string,
  ) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw Object.assign(new Error('Document not found'), { statusCode: 404 });

    return prisma.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verifiedBy: adminId,
        verifiedAt: status === 'verified' ? new Date() : undefined,
        rejectionReason: rejectionReason ?? null,
      },
    });
  }

  async getUsers(skip: number, take: number, search?: string) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { mobile: { contains: search } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { panNumber: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { wallet: true },
        omit: { otpHash: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async getPlatformMetrics() {
    const [
      totalUsers,
      kycCompleteUsers,
      totalCompanies,
      liveCompanies,
      totalTrades,
      totalVolumePaise,
      openOrders,
      totalWalletBalance,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { role: 'investor' } }),
      prisma.user.count({ where: { role: 'investor', kycStatus: 'complete' } }),
      prisma.company.count(),
      prisma.company.count({ where: { listingStatus: 'live' } }),
      prisma.trade.count(),
      prisma.trade.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.count({ where: { status: { in: ['open', 'partially_filled'] } } }),
      prisma.investorWallet.aggregate({ _sum: { availableBalance: true, escrowBalance: true } }),
    ]);

    return {
      users: { total: totalUsers, kycComplete: kycCompleteUsers },
      companies: { total: totalCompanies, live: liveCompanies },
      trading: {
        totalTrades,
        totalVolumeRupees: Number(totalVolumePaise._sum.totalAmount ?? 0) / 100,
        openOrders,
      },
      wallets: {
        totalAvailableRupees:
          Number(totalWalletBalance._sum.availableBalance ?? 0) / 100,
        totalEscrowRupees: Number(totalWalletBalance._sum.escrowBalance ?? 0) / 100,
      },
    };
  }

  async getAllTrades(skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.trade.findMany({
        orderBy: { tradedAt: 'desc' },
        skip,
        take,
        include: {
          company: { select: { name: true } },
          buyer: { select: { fullName: true, mobile: true } },
          seller: { select: { fullName: true, mobile: true } },
        },
      }),
      prisma.trade.count(),
    ]);
    return { items, total };
  }

  async setHealthScore(companyId: string, score: number, adminId: string) {
    if (score < 0 || score > 100) {
      throw Object.assign(new Error('Score must be 0–100'), { statusCode: 400 });
    }
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { businessHealthScore: score },
    });
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'company.health_score_set',
        entityType: 'company',
        entityId: companyId,
        metadata: { score },
      },
    });
    return company;
  }
}

export const adminService = new AdminService();
