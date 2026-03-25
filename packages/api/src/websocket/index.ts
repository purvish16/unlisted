import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

let io: SocketIOServer;

export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  const corsOrigin = (process.env['CORS_ORIGIN'] ?? 'http://localhost:3000').split(',');

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data['userId'] = payload.userId;
      socket.data['role'] = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data['userId'] as string;
    logger.debug('[WS] Client connected', { userId, socketId: socket.id });

    // Always join personal room for notifications
    void socket.join(`user:${userId}`);

    // ── Subscribe to a company's order book ──────────────────────────────────
    socket.on('orderbook:subscribe', (companyId: string) => {
      if (typeof companyId !== 'string') return;
      void socket.join(`company:${companyId}`);
      logger.debug('[WS] Subscribed to orderbook', { userId, companyId });
    });

    socket.on('orderbook:unsubscribe', (companyId: string) => {
      void socket.leave(`company:${companyId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug('[WS] Client disconnected', { userId, reason });
    });
  });

  logger.info('[WS] Socket.io server initialized');
  return io;
}

/** Get the Socket.io instance (throws if not yet initialized) */
export function getIO(): SocketIOServer {
  if (!io) throw new Error('WebSocket server not initialized');
  return io;
}
