import { FastifyInstance } from 'fastify';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export default async function hostStatsRoute(fastify: FastifyInstance) {
  fastify.get(
    '/stats',
    { preHandler: [verifyJWT, requireRole('HOST', 'ADMIN')] },
    async (request, reply) => {
      const user = request.user as { userId: string };

      const [gpus, rentals, payouts] = await Promise.all([
        prisma.gPU.findMany({
          where: { hostId: user.userId },
          select: { id: true, status: true, name: true, model: true, pricePerHourUSD: true },
        }),
        prisma.rental.findMany({
          where: {
            gpu: { hostId: user.userId },
          },
          include: {
            payment: { select: { status: true } },
            gpu: { select: { pricePerHourUSD: true } },
          },
        }),
        prisma.payout.findMany({
          where: {
            hostId: user.userId,
            status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
          },
          select: { amountUSD: true, status: true },
        }),
      ]);

      const activeGPUs = gpus.filter((g) => g.status === 'AVAILABLE' || g.status === 'IN_USE').length;
      const inUseGPUs = gpus.filter((g) => g.status === 'IN_USE').length;
      const activeRentals = rentals.filter((r) => r.status === 'ACTIVE').length;
      const totalRentals = rentals.length;

      const totalEarnings = rentals
        .filter((r) => r.payment?.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.totalCostUSD, 0);

      const totalPayouts = payouts.reduce((sum, p) => sum + p.amountUSD, 0);
      const availableBalance = totalEarnings - totalPayouts;

      return reply.send({
        gpus,
        stats: {
          activeGPUs,
          inUseGPUs,
          totalGPUs: gpus.length,
          activeRentals,
          totalRentals,
          totalEarnings,
          availableBalance,
        },
      });
    }
  );
}
