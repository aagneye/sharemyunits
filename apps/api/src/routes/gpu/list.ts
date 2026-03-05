import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';

const querySchema = z.object({
  status: z.enum(['AVAILABLE', 'IN_USE', 'OFFLINE', 'MAINTENANCE']).optional(),
  minVRAM: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export default async function listGPURoute(fastify: FastifyInstance) {
  fastify.get('/list', async (request, reply) => {
    const query = querySchema.parse(request.query);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.minVRAM) where.vramGB = { gte: query.minVRAM };
    if (query.maxPrice) where.pricePerHourUSD = { lte: query.maxPrice };

    const [gpus, total] = await Promise.all([
      prisma.gPU.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gPU.count({ where }),
    ]);

    return reply.send({
      gpus,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });
}
