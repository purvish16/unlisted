import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  getPortfolio,
  getHoldings,
  getHoldingByCompany,
} from '../controllers/investor.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/portfolio', getPortfolio);
router.get('/holdings', getHoldings);
router.get('/holdings/:companyId', getHoldingByCompany);

export default router;
