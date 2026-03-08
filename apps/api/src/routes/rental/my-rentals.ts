import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';

const querySchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export default async function myRentalsRoute(fastify: FastifyInstance) {
  fastify.get(
    '/my-rentals',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const user = request.user as { userId: string };
      const query = querySchema.parse(request.query);

      const where: any = { buyerId: user.userId };
      if (query.status) where.status = query.status;

      const [rentals, total] = await Promise.all([
        prisma.rental.findMany({
          where,
          include: {
            gpu: {
              select: {
                id: true,
                name: true,
                model: true,
                vramGB: true,
                pricePerHourUSD: true,
              },
            },
            vm: {
              select: {
                id: true,
                ipAddress: true,
                status: true,
                vmName: true,
              },
            },
            payment: {
              select: {
                status: true,
                paidAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.rental.count({ where }),
      ]);

      return reply.send({
        rentals,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit),
        },
      });
    }
  );
}
