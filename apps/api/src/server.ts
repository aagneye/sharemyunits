import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Routes
import authRoutes from './routes/auth';
import gpuRoutes from './routes/gpu';
import vmRoutes from './routes/vm';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const server = Fastify({
  logger: true,
});

async function build() {
  // Plugins
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });

  await server.register(helmet);

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
  });

  await server.register(websocket);

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Routes
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(gpuRoutes, { prefix: '/api/gpu' });
  await server.register(vmRoutes, { prefix: '/api/vm' });
  await server.register(paymentRoutes, { prefix: '/api/payment' });
  await server.register(adminRoutes, { prefix: '/api/admin' });

  // WebSocket for real-time GPU metrics
  server.register(async function (fastify) {
    fastify.get('/ws/gpu/:gpuId', { websocket: true }, (connection, req) => {
      const { gpuId } = req.params as { gpuId: string };
      
      // Subscribe to GPU metrics updates
      const channel = `gpu:${gpuId}:metrics`;
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
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await server.close();
  await prisma.$disconnect();
  await redis.quit();
});

export { server, prisma, redis };
