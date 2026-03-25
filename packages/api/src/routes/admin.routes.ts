import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  getApplications,
  reviewApplication,
  approveApplication,
  rejectApplication,
  goLive,
  verifyDocument,
  getUsers,
  getAllTrades,
  getPlatformMetrics,
  setHealthScore,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAdmin);

router.get('/applications', getApplications);
router.put('/applications/:id/review', reviewApplication);
router.post('/applications/:id/approve', approveApplication);
router.post('/applications/:id/reject', rejectApplication);
router.post('/companies/:id/go-live', goLive);
router.post('/companies/:id/health-score', setHealthScore);
router.put('/documents/:id/verify', verifyDocument);
router.get('/users', getUsers);
router.get('/trades', getAllTrades);
router.get('/platform-metrics', getPlatformMetrics);

export default router;
