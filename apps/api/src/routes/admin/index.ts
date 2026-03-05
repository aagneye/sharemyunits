import { FastifyInstance } from 'fastify';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export default async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require ADMIN role
  fastify.addHook('preHandler', [verifyJWT, requireRole('ADMIN')]);

  fastify.get('/users', async (request, reply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ users });
  });

  fastify.get('/gpus', async (request, reply) => {
    const gpus = await prisma.gPU.findMany({
      include: {
        host: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ gpus });
  });

  fastify.get('/disputes', async (request, reply) => {
    // In production, you'd have a Dispute model
    return reply.send({ disputes: [] });
  });
}
