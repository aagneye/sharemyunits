import { Worker } from 'bullmq';
import { redis } from '../server';
import { vmOrchestrator } from '../services/vm-orchestrator';

const worker = new Worker(
  'vm-terminate',
  async (job) => {
    const { vmId, gpuHostIP, proxmoxNode } = job.data;

    await vmOrchestrator.terminateVM({
      vmId,
      gpuHostIP,
      proxmoxNode,
    });

    return { success: true };
  },
  {
    connection: redis,
    concurrency: 10,
  }
);

worker.on('completed', (job) => {
  console.log(`VM terminate job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`VM terminate job ${job?.id} failed:`, err);
});

export default worker;
