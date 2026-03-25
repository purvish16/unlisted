import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { logger } from './lib/logger.js';

// BigInt serialization — all BigInt values sent as numbers (paise → divided by 100 on frontend)
// This must be set before any res.json() call.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

export function createApp() {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const corsOrigins = (process.env['CORS_ORIGIN'] ?? 'http://localhost:3000').split(',').map(s => s.trim());
  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // ── Request parsing ───────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());

  // ── Logging ───────────────────────────────────────────────────────────────
  if (process.env['NODE_ENV'] !== 'test') {
    app.use(morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (req) => req.url === '/api/v1/health',
    }));
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  app.use('/api/', apiLimiter);

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/v1', routes);

  // ── 404 + Error handlers (must be last) ──────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
