import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMyTrades, getTrade, signTrade } from '../controllers/trades.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/my-trades', getMyTrades);
router.get('/:id', getTrade);
router.post('/:id/sign', signTrade);

export default router;
