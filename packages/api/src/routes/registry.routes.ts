import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  getCompanyHoldings,
  getCertificate,
  getMyCertificates,
} from '../controllers/registry.controller.js';

const router = Router();

router.get('/my-certificates', requireAuth, getMyCertificates);
router.get('/certificate/:id', requireAuth, getCertificate);
router.get('/:companyId/holdings', requireAdmin, getCompanyHoldings);

export default router;
