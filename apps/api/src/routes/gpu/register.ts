import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const registerGPUSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  vramGB: z.number().positive(),
  cudaCores: z.number().positive().optional(),
  memoryBandwidth: z.number().positive().optional(),
  baseClockMHz: z.number().positive().optional(),
  boostClockMHz: z.number().positive().optional(),
  pricePerHourUSD: z.number().positive(),
  hostIP: z.string().ip(),
  proxmoxNode: z.string().optional(),
});

export default async function registerGPURoute(fastify: FastifyInstance) {
  fastify.post(
    '/register',
    { preHandler: [verifyJWT, requireRole('HOST', 'ADMIN')] },
    async (request, reply) => {
      const body = registerGPUSchema.parse(request.body);
      const user = request.user as { userId: string };

      const gpu = await prisma.gPU.create({
        data: {
          ...body,
          hostId: user.userId,
          status: 'AVAILABLE',
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return reply.status(201).send({ gpu });
    }
  );
}
