import { Router } from 'express';
import authRoutes from './auth.routes.js';
import kycRoutes from './kyc.routes.js';
import investorRoutes from './investor.routes.js';
import walletRoutes from './wallet.routes.js';
import companyRoutes from './company.routes.js';
import raisesRoutes from './raises.routes.js';
import ordersRoutes from './orders.routes.js';
import tradesRoutes from './trades.routes.js';
import registryRoutes from './registry.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/investor', investorRoutes);
router.use('/wallet', walletRoutes);
router.use('/companies', companyRoutes);
router.use('/raises', raisesRoutes);
router.use('/orders', ordersRoutes);
router.use('/trades', tradesRoutes);
router.use('/registry', registryRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
