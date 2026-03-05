import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const payoutSchema = z.object({
  amountUSD: z.number().positive().min(10), // Minimum $10 payout
});

export default async function payoutRoute(fastify: FastifyInstance) {
  fastify.post(
    '/payout',
    { preHandler: [verifyJWT, requireRole('HOST', 'ADMIN')] },
    async (request, reply) => {
      const body = payoutSchema.parse(request.body);
      const user = request.user as { userId: string };

      // Calculate available earnings
      const completedRentals = await prisma.rental.findMany({
        where: {
          gpu: { hostId: user.userId },
          status: 'ACTIVE',
          payment: {
            status: 'COMPLETED',
          },
        },
        include: {
          payment: true,
        },
      });

      const totalEarnings = completedRentals.reduce(
        (sum, rental) => sum + rental.totalCostUSD,
        0
      );

      const existingPayouts = await prisma.payout.findMany({
        where: {
          hostId: user.userId,
          status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
        },
      });

      const totalPayouts = existingPayouts.reduce(
        (sum, payout) => sum + payout.amountUSD,
        0
      );

      const availableBalance = totalEarnings - totalPayouts;

      if (body.amountUSD > availableBalance) {
        return reply.status(400).send({
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}`,
        });
      }

      // Create payout request
      const payout = await prisma.payout.create({
        data: {
          hostId: user.userId,
          amountUSD: body.amountUSD,
          status: 'PENDING',
        },
      });

      // In production, this would trigger Stripe Connect payout
      return reply.status(201).send({ payout });
    }
  );
}
