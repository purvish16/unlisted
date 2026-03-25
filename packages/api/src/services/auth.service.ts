import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { generateOtp, storeOtp, verifyOtp, sendOtp, checkOtpAttempts } from '../lib/otp.js';
import type { UserRole } from '@prisma/client';

export class AuthService {
  /**
   * Send an OTP to the given mobile number.
   * Creates the user if they don't exist yet.
   */
  async sendOtp(mobile: string): Promise<{ isNewUser: boolean }> {
    // Validate mobile format
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw Object.assign(new Error('Invalid mobile number'), { statusCode: 400 });
    }

    // Check attempt limit
    const allowed = await checkOtpAttempts(mobile);
    if (!allowed) {
      throw Object.assign(new Error('OTP limit reached. Try again in an hour.'), {
        statusCode: 429,
      });
    }

    const existing = await prisma.user.findUnique({ where: { mobile } });
    const isNewUser = !existing;

    if (isNewUser) {
      // Create user with minimal data — onboarding completes the rest
      await prisma.user.create({
        data: {
          mobile,
          role: 'investor',
          wallet: { create: {} },
        },
      });
    }

    const otp = generateOtp();
    await storeOtp(mobile, otp);
    await sendOtp(mobile, otp);

    return { isNewUser };
  }

  /**
   * Verify OTP and return access + refresh tokens.
   */
  async verifyOtp(
    mobile: string,
    otp: string,
  ): Promise<{ accessToken: string; refreshToken: string; isNewUser: boolean; user: { id: string; mobile: string; kycStatus: string; kycLevel: number; role: UserRole } }> {
    const valid = await verifyOtp(mobile, otp);
    if (!valid) {
      throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 401 });
    }

    const user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokenId = uuidv4();
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role as 'investor' | 'company_admin' | 'admin',
      mobile: user.mobile,
    });
    const refreshToken = signRefreshToken({ userId: user.id, tokenId });

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.refreshToken.create({
      data: { id: tokenId, userId: user.id, token: refreshToken, expiresAt },
    });

    const isNewUser = user.kycLevel === 0;

    return {
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user.id,
        mobile: user.mobile,
        kycStatus: user.kycStatus,
        kycLevel: user.kycLevel,
        role: user.role,
      },
    };
  }

  /**
   * Issue new access token from a valid refresh token.
   */
  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    const stored = await prisma.refreshToken.findFirst({
      where: { id: payload.tokenId, token, revokedAt: null },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw Object.assign(new Error('Refresh token expired or revoked'), { statusCode: 401 });
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const newTokenId = uuidv4();
    const newAccessToken = signAccessToken({
      userId: stored.user.id,
      role: stored.user.role as 'investor' | 'company_admin' | 'admin',
      mobile: stored.user.mobile,
    });
    const newRefreshToken = signRefreshToken({ userId: stored.user.id, tokenId: newTokenId });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.refreshToken.create({
      data: { id: newTokenId, userId: stored.user.id, token: newRefreshToken, expiresAt },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /** Revoke a refresh token (logout) */
  async logout(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }
}

export const authService = new AuthService();
