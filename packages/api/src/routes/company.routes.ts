import { Router } from 'express';
import {
  listCompanies,
  getCompany,
  getOrderBook,
  getCompanyTrades,
  getTrending,
  getSectors,
} from '../controllers/company.controller.js';

const router = Router();

// Public routes — no auth required
router.get('/', listCompanies);
router.get('/trending', getTrending);
router.get('/sectors', getSectors);
router.get('/:id', getCompany);
router.get('/:id/orderbook', getOrderBook);
router.get('/:id/trades', getCompanyTrades);

export default router;
