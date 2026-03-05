import { Worker } from 'bullmq';
import { redis } from '../server';
import { vmOrchestrator } from '../services/vm-orchestrator';
import { notificationService } from '../services/notification-service';
import { prisma } from '../server';

const worker = new Worker(
  'vm-provision',
  async (job) => {
    const { rentalId, gpuId, gpuHostIP, proxmoxNode } = job.data;

    // Provision VM
    const vm = await vmOrchestrator.provisionVM({
      rentalId,
      gpuId,
      gpuHostIP,
      proxmoxNode,
    });

    // Get rental details for notification
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        buyer: true,
        vm: true,
      },
    });

    if (rental && rental.vm) {
      // Send notification
      await notificationService.notifyVMProvisioned({
        email: rental.buyer.email,
        vmIP: rental.vm.ipAddress || 'N/A',
        sshKeyDownloadUrl: `/api/vm/ssh-credentials/${rentalId}`,
      });
    }

    return { vmId: vm.id };
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`VM provision job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`VM provision job ${job?.id} failed:`, err);
});

export default worker;
