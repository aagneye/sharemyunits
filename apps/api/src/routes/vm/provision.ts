import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { vmOrchestrator } from '../../services/vm-orchestrator';
import { sshKeyService } from '../../services/ssh-key-service';

const provisionSchema = z.object({
  gpuId: z.string(),
  durationHours: z.number().positive().max(168), // Max 7 days
});

export default async function provisionVMRoute(fastify: FastifyInstance) {
  fastify.post(
    '/provision',
    { preHandler: [verifyJWT, requireRole('BUYER', 'ADMIN')] },
    async (request, reply) => {
      const body = provisionSchema.parse(request.body);
      const user = request.user as { userId: string };

      // Check GPU availability
      const gpu = await prisma.gPU.findUnique({
        where: { id: body.gpuId },
      });

      if (!gpu || gpu.status !== 'AVAILABLE') {
        return reply.status(400).send({ error: 'GPU not available' });
      }

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + body.durationHours * 60 * 60 * 1000);
      const totalCost = gpu.pricePerHourUSD * body.durationHours;

      // Create rental
      const rental = await prisma.rental.create({
        data: {
          buyerId: user.userId,
          gpuId: body.gpuId,
          startTime,
          endTime,
          totalCostUSD: totalCost,
          status: 'ACTIVE',
        },
      });

      // Queue VM provisioning job
      // In production, this would use BullMQ
      const vm = await vmOrchestrator.provisionVM({
        rentalId: rental.id,
        gpuId: body.gpuId,
        gpuHostIP: gpu.hostIP,
        proxmoxNode: gpu.proxmoxNode,
      });

      // Generate SSH keypair
      const sshKey = await sshKeyService.generateKeypair({
        userId: user.userId,
        rentalId: rental.id,
      });

      // Update GPU status
      await prisma.gPU.update({
        where: { id: body.gpuId },
        data: { status: 'IN_USE' },
      });

      return reply.status(201).send({
        rental,
        vm,
        sshKey: {
          id: sshKey.id,
          fingerprint: sshKey.fingerprint,
          downloadUrl: `/api/vm/ssh-credentials/${sshKey.id}`,
        },
      });
    }
  );
}
