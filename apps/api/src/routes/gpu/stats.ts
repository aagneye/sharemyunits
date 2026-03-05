import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';

const paramsSchema = z.object({
  gpuId: z.string(),
});

export default async function statsGPURoute(fastify: FastifyInstance) {
  fastify.get('/:gpuId/stats', async (request, reply) => {
    const { gpuId } = paramsSchema.parse(request.params);

    const metrics = await prisma.gPUMetric.findMany({
      where: { gpuId },
      orderBy: { timestamp: 'desc' },
      take: 100, // Last 100 data points
    });

    return reply.send({ metrics });
  });
}
