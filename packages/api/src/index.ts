import { createServer } from 'http';
import { createApp } from './app.js';
import { initWebSocket } from './websocket/index.js';
import { initQueues } from './jobs/index.js';
import { redis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';

const PORT = parseInt(process.env['PORT'] ?? '4000', 10);

async function main() {
  // ── Verify DB connection ─────────────────────────────────────────────────
  try {
    await prisma.$connect();
    logger.info('[DB] PostgreSQL connected');
  } catch (err) {
    logger.error('[DB] Failed to connect to PostgreSQL', { error: err });
    process.exit(1);
  }

  // ── Verify Redis connection ──────────────────────────────────────────────
  try {
    await redis.connect();
    logger.info('[Redis] Connected');
  } catch (err) {
    logger.warn('[Redis] Could not connect — some features may be limited', { error: err });
  }

  // ── Create HTTP server ───────────────────────────────────────────────────
  const app = createApp();
  const httpServer = createServer(app);

  // ── WebSocket ────────────────────────────────────────────────────────────
  initWebSocket(httpServer);

  // ── Background jobs ──────────────────────────────────────────────────────
  initQueues();

  // ── Start listening ──────────────────────────────────────────────────────
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Unlisted API running on http://localhost:${PORT}`);
    logger.info(`   Env: ${process.env['NODE_ENV'] ?? 'development'}`);
    logger.info(`   Docs: http://localhost:${PORT}/api/v1/health`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`[Server] ${signal} received — shutting down`);
    httpServer.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      logger.info('[Server] Graceful shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('[Server] Fatal startup error', { error: err });
  process.exit(1);
});
