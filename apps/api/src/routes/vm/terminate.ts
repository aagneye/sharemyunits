import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { vmOrchestrator } from '../../services/vm-orchestrator';

const paramsSchema = z.object({
  rentalId: z.string(),
});

export default async function terminateVMRoute(fastify: FastifyInstance) {
  fastify.post(
    '/:rentalId/terminate',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { rentalId } = paramsSchema.parse(request.params);
      const user = request.user as { userId: string; role: string };

      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: { vm: true, gpu: true },
      });

      if (!rental) {
        return reply.status(404).send({ error: 'Rental not found' });
      }

      // Check authorization
      if (rental.buyerId !== user.userId && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      if (rental.status === 'EXPIRED' || rental.status === 'CANCELLED') {
        return reply.status(400).send({ error: 'Rental already terminated' });
      }

      // Terminate VM
      if (rental.vm) {
        await vmOrchestrator.terminateVM({
          vmId: rental.vm.vmId!,
          gpuHostIP: rental.gpu.hostIP,
          proxmoxNode: rental.gpu.proxmoxNode,
        });
      }

      // Update rental status
      await prisma.rental.update({
        where: { id: rentalId },
        data: {
          status: 'CANCELLED',
          vm: {
            update: {
              status: 'TERMINATED',
              terminatedAt: new Date(),
            },
          },
        },
      });

      // Free GPU
      await prisma.gPU.update({
        where: { id: rental.gpuId },
        data: { status: 'AVAILABLE' },
      });

      return reply.send({ message: 'VM terminated successfully' });
    }
  );
}
