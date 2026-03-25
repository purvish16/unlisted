import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getKycStatus,
  verifyPan,
  verifyBank,
  initiateAadhaar,
  completeAadhaar,
} from '../controllers/kyc.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/status', getKycStatus);
router.post('/verify-pan', verifyPan);
router.post('/verify-bank', verifyBank);
router.post('/initiate-aadhaar', initiateAadhaar);
router.post('/complete-aadhaar', completeAadhaar);

export default router;
