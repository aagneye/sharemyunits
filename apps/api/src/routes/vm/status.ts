import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';

const paramsSchema = z.object({
  rentalId: z.string(),
});

export default async function statusVMRoute(fastify: FastifyInstance) {
  fastify.get(
    '/:rentalId/status',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { rentalId } = paramsSchema.parse(request.params);
      const user = request.user as { userId: string; role: string };

      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: {
          vm: true,
          gpu: {
            include: {
              metrics: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!rental) {
        return reply.status(404).send({ error: 'Rental not found' });
      }

      if (rental.buyerId !== user.userId && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      return reply.send({ rental });
    }
  );
}
