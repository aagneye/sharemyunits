import { prisma } from '../server';

class BillingMeter {
  /**
   * Records usage and calculates billing for a rental
   * Called periodically (e.g., every minute) for active rentals
   */
  async recordUsage(rentalId: string) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { gpu: true },
    });

    if (!rental || rental.status !== 'ACTIVE') {
      return;
    }

    const now = new Date();
    const startTime = rental.startTime;
    const endTime = rental.endTime < now ? rental.endTime : now;

    // Calculate minutes used since last billing record
    const lastBilling = await prisma.billingRecord.findFirst({
      where: { rentalId },
      orderBy: { timestamp: 'desc' },
    });

    const lastTimestamp = lastBilling?.timestamp || startTime;
    const minutesUsed = Math.floor((endTime.getTime() - lastTimestamp.getTime()) / (1000 * 60));

    if (minutesUsed <= 0) {
      return;
    }

    // Calculate cost (price per hour / 60 * minutes)
    const costPerMinute = rental.gpu.pricePerHourUSD / 60;
    const costUSD = costPerMinute * minutesUsed;

    // Create billing record
    await prisma.billingRecord.create({
      data: {
        rentalId,
        minutesUsed,
        costUSD,
      },
    });

    // If rental has expired, mark it as expired
    if (now >= rental.endTime) {
      await prisma.rental.update({
        where: { id: rentalId },
        data: { status: 'EXPIRED' },
      });

      // Terminate VM
      const vm = await prisma.vM.findUnique({
        where: { rentalId },
      });

      if (vm && vm.status === 'RUNNING') {
        // Trigger VM termination
        // This would be handled by a worker
      }
    }
  }

  /**
   * Processes billing for all active rentals
   */
  async processAllActiveRentals() {
    const activeRentals = await prisma.rental.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const rental of activeRentals) {
      await this.recordUsage(rental.id);
    }
  }
}

export const billingMeter = new BillingMeter();
