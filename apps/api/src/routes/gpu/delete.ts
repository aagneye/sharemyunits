import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const paramsSchema = z.object({
  id: z.string(),
});

export default async function deleteGPURoute(fastify: FastifyInstance) {
  fastify.delete(
    '/:id',
    { preHandler: [verifyJWT, requireRole('HOST', 'ADMIN')] },
    async (request, reply) => {
      const { id } = paramsSchema.parse(request.params);
      const user = request.user as { userId: string; role: string };

      const gpu = await prisma.gPU.findUnique({ where: { id } });

      if (!gpu) {
        return reply.status(404).send({ error: 'GPU not found' });
      }

      if (gpu.hostId !== user.userId && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      if (gpu.status === 'IN_USE') {
        return reply.status(400).send({ error: 'Cannot delete a GPU that is currently in use' });
      }

      await prisma.gPU.delete({ where: { id } });

      return reply.send({ message: 'GPU deleted successfully' });
    }
  );
}
