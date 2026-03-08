import { FastifyInstance } from 'fastify';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

export default async function myGPUsRoute(fastify: FastifyInstance) {
  fastify.get(
    '/my-gpus',
    { preHandler: [verifyJWT, requireRole('HOST', 'ADMIN')] },
    async (request, reply) => {
      const user = request.user as { userId: string };

      const gpus = await prisma.gPU.findMany({
        where: { hostId: user.userId },
        include: {
          rentals: {
            where: { status: 'ACTIVE' },
            select: { id: true },
          },
          _count: {
            select: { rentals: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ gpus });
    }
  );
}
