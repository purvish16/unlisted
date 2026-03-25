import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { financialLimiter } from '../middleware/rateLimiter.js';
import { getRaise, invest, getMyAllocation } from '../controllers/raises.controller.js';

const router = Router();

router.get('/:companyId', getRaise);
router.post('/:companyId/invest', requireAuth, financialLimiter, invest);
router.get('/:companyId/my-allocation', requireAuth, getMyAllocation);

export default router;
