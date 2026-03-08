import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await verifyJWT(request, reply);
    await requireRole('ADMIN')(request, reply);
  });

  fastify.get('/users', async (request, reply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ownedGPUs: true,
            rentals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ users });
  });

  const roleSchema = z.object({ role: z.enum(['BUYER', 'HOST', 'ADMIN']) });
  const userIdSchema = z.object({ id: z.string() });

  fastify.put('/users/:id/role', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);
    const { role } = roleSchema.parse(request.body);

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    return reply.send({ user });
  });

  fastify.get('/gpus', async (request, reply) => {
    const gpus = await prisma.gPU.findMany({
      include: {
        host: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { rentals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ gpus });
  });

  const gpuIdSchema = z.object({ id: z.string() });
  const gpuStatusSchema = z.object({
    status: z.enum(['AVAILABLE', 'OFFLINE', 'MAINTENANCE']),
  });

  fastify.put('/gpus/:id/status', async (request, reply) => {
    const { id } = gpuIdSchema.parse(request.params);
    const { status } = gpuStatusSchema.parse(request.body);

    const gpu = await prisma.gPU.update({
      where: { id },
      data: { status },
    });

    return reply.send({ gpu });
  });

  fastify.get('/stats', async (request, reply) => {
    const [userCount, gpuCount, rentalCount, activeRentals, completedPayments] =
      await Promise.all([
        prisma.user.count(),
        prisma.gPU.count(),
        prisma.rental.count(),
        prisma.rental.count({ where: { status: 'ACTIVE' } }),
        prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amountUSD: true },
        }),
      ]);

    const byRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const byGPUStatus = await prisma.gPU.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return reply.send({
      stats: {
        totalUsers: userCount,
        totalGPUs: gpuCount,
        totalRentals: rentalCount,
        activeRentals,
        totalRevenue: completedPayments._sum.amountUSD || 0,
        usersByRole: byRole,
        gpusByStatus: byGPUStatus,
      },
    });
  });

  fastify.get('/disputes', async (request, reply) => {
    return reply.send({ disputes: [] });
  });
}
