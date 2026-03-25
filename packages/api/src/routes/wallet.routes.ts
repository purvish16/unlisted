import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { financialLimiter } from '../middleware/rateLimiter.js';
import {
  getBalance,
  getTransactions,
  initiateAddFunds,
  verifyAddFunds,
  initiateWithdraw,
  verifyWithdraw,
} from '../controllers/wallet.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/add-funds/initiate', financialLimiter, initiateAddFunds);
router.post('/add-funds/verify', financialLimiter, verifyAddFunds);
router.post('/withdraw/initiate', financialLimiter, initiateWithdraw);
router.post('/withdraw/verify', financialLimiter, verifyWithdraw);

export default router;
