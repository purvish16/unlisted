import { Router } from 'express';
import { sendOtp, verifyOtp, refreshToken, logout } from '../controllers/auth.controller.js';
import { otpSendLimiter, authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/send-otp', otpSendLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;
