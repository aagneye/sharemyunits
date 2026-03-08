import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const paramsSchema = z.object({
  id: z.string(),
});

const bodySchema = z.object({
  status: z.enum(['AVAILABLE', 'OFFLINE', 'MAINTENANCE']),
});

export default async function updateGPUStatusRoute(fastify: FastifyInstance) {
  fastify.put(
    '/:id/status',
    { preHandler: [verifyJWT, requireRole('HOST', 'ADMIN')] },
    async (request, reply) => {
      const { id } = paramsSchema.parse(request.params);
      const body = bodySchema.parse(request.body);
      const user = request.user as { userId: string; role: string };

      const gpu = await prisma.gPU.findUnique({ where: { id } });

      if (!gpu) {
        return reply.status(404).send({ error: 'GPU not found' });
      }

      if (gpu.hostId !== user.userId && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      if (gpu.status === 'IN_USE') {
        return reply.status(400).send({ error: 'Cannot change status of a GPU that is in use' });
      }

      const updated = await prisma.gPU.update({
        where: { id },
        data: { status: body.status },
      });

      return reply.send({ gpu: updated });
    }
  );
}
