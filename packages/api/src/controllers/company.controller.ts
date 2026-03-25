import type { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service.js';
import { ok, paginated, parsePagination } from '../lib/response.js';
import type { ListingStatus } from '@prisma/client';

export async function listCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { search, sector, status, sortBy, sortDir } = req.query as Record<string, string>;

    const { items, total } = await companyService.list({
      search,
      sector,
      status: status as ListingStatus | undefined,
      skip,
      take: limit,
      sortBy,
      sortDir: sortDir as 'asc' | 'desc' | undefined,
    });

    paginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await companyService.getById(req.params['id']!);
    ok(res, company);
  } catch (err) {
    next(err);
  }
}

export async function getOrderBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orderBook = await companyService.getOrderBook(req.params['id']!);
    ok(res, orderBook);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyTrades(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const trades = await companyService.getRecentTrades(req.params['id']!);
    ok(res, trades);
  } catch (err) {
    next(err);
  }
}

export async function getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companies = await companyService.getTrending();
    ok(res, companies);
  } catch (err) {
    next(err);
  }
}

export async function getSectors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sectors = await companyService.getSectors();
    ok(res, sectors);
  } catch (err) {
    next(err);
  }
}
