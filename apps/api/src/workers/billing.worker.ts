import { Worker } from 'bullmq';
import { redis } from '../server';
import { billingMeter } from '../services/billing-meter';

const worker = new Worker(
  'billing',
  async (job) => {
    const { rentalId } = job.data;

    await billingMeter.recordUsage(rentalId);
  },
  {
    connection: redis,
    concurrency: 20,
  }
);

// Schedule periodic billing for all active rentals
setInterval(async () => {
  await billingMeter.processAllActiveRentals();
}, 60000); // Every minute

worker.on('completed', (job) => {
  console.log(`Billing job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Billing job ${job?.id} failed:`, err);
});

export default worker;
