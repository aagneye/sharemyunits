import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import authRoutes from './routes/auth';
import gpuRoutes from './routes/gpu';
import vmRoutes from './routes/vm';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import rentalRoutes from './routes/rental';
import hostRoutes from './routes/host';

export const prisma = new PrismaClient();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  maxRetriesPerRequest: 0,
});

redis.on('error', () => {});

export { redis };

const server = Fastify({
  logger: true,
});

async function build() {
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });

  await server.register(helmet);

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  const redisConnected = await redis.ping().then(() => true).catch(() => false);

  if (redisConnected) {
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      redis,
    });
  } else {
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });
    server.log.warn('Redis unavailable — using in-memory rate limiting');
  }

  await server.register(websocket);

  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(gpuRoutes, { prefix: '/api/gpu' });
  await server.register(vmRoutes, { prefix: '/api/vm' });
  await server.register(paymentRoutes, { prefix: '/api/payment' });
  await server.register(adminRoutes, { prefix: '/api/admin' });
  await server.register(rentalRoutes, { prefix: '/api/rental' });
  await server.register(hostRoutes, { prefix: '/api/host' });

  server.register(async function (fastify) {
    fastify.get('/ws/gpu/:gpuId', { websocket: true }, (connection, req) => {
      const { gpuId } = req.params as { gpuId: string };
      const channel = `gpu:${gpuId}:metrics`;

      if (!redisConnected) {
        connection.socket.send(JSON.stringify({ error: 'Real-time metrics unavailable' }));
        return;
      }

      const subscriber = redis.duplicate();
      subscriber.subscribe(channel);
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          connection.socket.send(message);
        }
      });

      connection.socket.on('close', () => {
        subscriber.unsubscribe(channel);
        subscriber.quit();
      });
    });
  });
}

const start = async () => {
  try {
    await build();
    const port = Number(process.env.API_PORT) || 8000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', async () => {
  await server.close();
  await prisma.$disconnect();
  await redis.quit().catch(() => {});
});

export { server };
