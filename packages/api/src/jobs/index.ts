import Bull from 'bull';
import { logger } from '../lib/logger.js';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

const defaultOpts: Bull.QueueOptions = {
  redis: REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
};

// ── Queue definitions ─────────────────────────────────────────────────────────

export const notificationQueue = new Bull<NotificationJob>('notifications', defaultOpts);
export const settlementQueue = new Bull<SettlementJob>('settlements', defaultOpts);
export const dividendQueue = new Bull<DividendJob>('dividends', defaultOpts);
export const emailQueue = new Bull<EmailJob>('emails', defaultOpts);

// ── Job type interfaces ────────────────────────────────────────────────────────

interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface SettlementJob {
  tradeId: string;
}

interface DividendJob {
  dividendId: string;
}

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ── Workers ───────────────────────────────────────────────────────────────────

notificationQueue.process(async (job) => {
  const { userId, type, title, body, data } = job.data;
  const { prisma } = await import('../lib/prisma.js');
  await prisma.notification.create({
    data: { userId, type, title, body, data: data ?? {} },
  });
  logger.debug('[Job] Notification created', { userId, type });
});

settlementQueue.process(async (job) => {
  const { tradeId } = job.data;
  logger.info('[Job] Processing settlement', { tradeId });
  // T+2 settlement:
  // 1. Generate SH-4 transfer form PDF
  // 2. Store in S3, update trade record
  // 3. Send eSign request via Digio to both buyer and seller
  // For now: mark as settled in dev
  if (process.env['NODE_ENV'] === 'development') {
    const { prisma } = await import('../lib/prisma.js');
    await prisma.trade.update({
      where: { id: tradeId },
      data: { settlementStatus: 'settled', settledAt: new Date() },
    });
  }
});

dividendQueue.process(async (job) => {
  const { dividendId } = job.data;
  logger.info('[Job] Processing dividend payout', { dividendId });
  const { prisma } = await import('../lib/prisma.js');
  const { walletService } = await import('../services/wallet.service.js');

  const dividend = await prisma.dividend.findUnique({ where: { id: dividendId } });
  if (!dividend) return;

  // Get all shareholders at record date
  const shareholders = await prisma.shareRegistry.findMany({
    where: { companyId: dividend.companyId, sharesHeld: { gt: BigInt(0) } },
  });

  let totalPayout = BigInt(0);
  for (const sh of shareholders) {
    const amount = dividend.amountPerShare * sh.sharesHeld;
    totalPayout += amount;
    await walletService.credit(sh.shareholderId, amount, 'dividend', {
      referenceId: dividendId,
      referenceType: 'dividend',
      description: `Dividend from ${dividend.companyId} — ${sh.sharesHeld} shares`,
    });
  }

  await prisma.dividend.update({
    where: { id: dividendId },
    data: { status: 'paid', totalPayout },
  });
});

emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  if (process.env['NODE_ENV'] === 'development') {
    logger.info('[Job] Email (dev, not sent)', { to, subject });
    return;
  }
  // Production: SendGrid
  logger.info('[Job] Sending email via SendGrid', { to, subject });
});

// ── Error handlers ─────────────────────────────────────────────────────────────

for (const queue of [notificationQueue, settlementQueue, dividendQueue, emailQueue]) {
  queue.on('failed', (job, err) => {
    logger.error(`[Job] ${queue.name} job failed`, { jobId: job.id, error: err.message });
  });
}

export function initQueues() {
  logger.info('[Jobs] Bull queues initialized', {
    queues: ['notifications', 'settlements', 'dividends', 'emails'],
  });
}
