import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export class KycService {
  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycLevel: true,
        mobile: true,
        panNumber: true,
        panVerifiedAt: true,
        bankAccountNumber: true,
        bankVerifiedAt: true,
        aadhaarVerifiedAt: true,
      },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    return {
      kycStatus: user.kycStatus,
      kycLevel: user.kycLevel,
      steps: {
        mobile: true, // always true — they logged in via OTP
        pan: !!user.panVerifiedAt,
        bank: !!user.bankVerifiedAt,
        aadhaar: !!user.aadhaarVerifiedAt,
      },
    };
  }

  async verifyPan(
    userId: string,
    data: { panNumber: string; fullName: string; dateOfBirth: string },
  ) {
    const { panNumber, fullName, dateOfBirth } = data;

    // Validate PAN format: AAAAA9999A
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      throw Object.assign(new Error('Invalid PAN format'), { statusCode: 400 });
    }

    // Check not already used
    const existing = await prisma.user.findFirst({
      where: { panNumber, NOT: { id: userId } },
    });
    if (existing) {
      throw Object.assign(new Error('PAN already linked to another account'), { statusCode: 409 });
    }

    // In dev: mock NSDL verification
    // In prod: call NSDL API
    if (process.env['NODE_ENV'] !== 'production') {
      logger.info('[KYC] Mock PAN verification', { panNumber, userId });
      await prisma.user.update({
        where: { id: userId },
        data: {
          panNumber,
          fullName,
          dateOfBirth: new Date(dateOfBirth),
          panVerifiedAt: new Date(),
          kycLevel: { increment: 0 }, // level set in updateKycLevel
        },
      });
      await this.updateKycLevel(userId);
      return { verified: true, name: fullName };
    }

    throw Object.assign(new Error('NSDL integration not configured'), { statusCode: 503 });
  }

  async verifyBank(
    userId: string,
    data: { accountNumber: string; ifscCode: string; accountHolderName: string },
  ) {
    const { accountNumber, ifscCode, accountHolderName } = data;

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      throw Object.assign(new Error('Invalid IFSC code format'), { statusCode: 400 });
    }

    // In dev: mock penny drop
    if (process.env['NODE_ENV'] !== 'production') {
      logger.info('[KYC] Mock bank verification', { accountNumber, ifscCode, userId });
      await prisma.user.update({
        where: { id: userId },
        data: {
          bankAccountNumber: accountNumber,
          bankIfscCode: ifscCode,
          bankAccountName: accountHolderName,
          bankVerifiedAt: new Date(),
        },
      });
      await this.updateKycLevel(userId);
      return { verified: true };
    }

    throw Object.assign(new Error('Bank verification not configured'), { statusCode: 503 });
  }

  async initiateAadhaar(userId: string) {
    // In dev: mock Digio eKYC
    if (process.env['NODE_ENV'] !== 'production') {
      logger.info('[KYC] Mock Aadhaar initiation', { userId });
      return {
        requestId: `digio_mock_${userId}`,
        redirectUrl: `http://localhost:4000/api/v1/kyc/mock-aadhaar-callback?userId=${userId}`,
      };
    }
    throw Object.assign(new Error('Digio integration not configured'), { statusCode: 503 });
  }

  async completeAadhaar(userId: string, requestId: string) {
    if (process.env['NODE_ENV'] !== 'production') {
      logger.info('[KYC] Mock Aadhaar completion', { userId, requestId });
      await prisma.user.update({
        where: { id: userId },
        data: { aadhaarVerifiedAt: new Date() },
      });
      await this.updateKycLevel(userId);
      return { verified: true };
    }
    throw Object.assign(new Error('Digio integration not configured'), { statusCode: 503 });
  }

  /** Recalculate and persist KYC level based on completed steps */
  private async updateKycLevel(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { panVerifiedAt: true, bankVerifiedAt: true, aadhaarVerifiedAt: true },
    });
    if (!user) return;

    let level = 1; // mobile verified = level 1
    if (user.panVerifiedAt) level = 2;
    if (user.panVerifiedAt && user.bankVerifiedAt) level = 2;
    if (user.panVerifiedAt && user.bankVerifiedAt && user.aadhaarVerifiedAt) level = 3;

    const kycStatus = level === 3 ? 'complete' : level >= 1 ? 'partial' : 'pending';
    await prisma.user.update({ where: { id: userId }, data: { kycLevel: level, kycStatus } });
  }
}

export const kycService = new KycService();
