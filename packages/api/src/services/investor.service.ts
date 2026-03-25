import { prisma } from '../lib/prisma.js';

export class InvestorService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        mobile: true,
        fullName: true,
        panNumber: true,
        kycStatus: true,
        kycLevel: true,
        isAccreditedInvestor: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        bankAccountName: true,
        bankVerifiedAt: true,
        panVerifiedAt: true,
        aadhaarVerifiedAt: true,
        city: true,
        state: true,
        createdAt: true,
      },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  async updateProfile(
    userId: string,
    data: { email?: string; city?: string; state?: string; address?: string; pincode?: string },
  ) {
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: userId } },
      });
      if (existing) {
        throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
      }
    }
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        mobile: true,
        fullName: true,
        city: true,
        state: true,
        address: true,
        pincode: true,
      },
    });
  }
}

export const investorService = new InvestorService();
