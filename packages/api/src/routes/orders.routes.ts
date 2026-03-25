import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { financialLimiter } from '../middleware/rateLimiter.js';
import { placeOrder, cancelOrder, getMyOrders, getOrder } from '../controllers/order.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/place', financialLimiter, placeOrder);
router.put('/:id/cancel', cancelOrder);
router.get('/my-orders', getMyOrders);
router.get('/my-orders/:id', getOrder);

export default router;
