import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { prisma } from '../../server';
import { vmOrchestrator } from '../../services/vm-orchestrator';
import { sshKeyService } from '../../services/ssh-key-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export default async function webhookRoute(fastify: FastifyInstance) {
  fastify.post('/webhook', async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as string,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      fastify.log.error(`Webhook signature verification failed: ${err.message}`);
      return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const rentalId = session.metadata?.rentalId;

      if (!rentalId) {
        fastify.log.error('Missing rentalId in session metadata');
        return reply.status(400).send({ error: 'Missing rentalId' });
      }

      // Update payment status
      const payment = await prisma.payment.update({
        where: { rentalId },
        data: {
          status: 'COMPLETED',
          stripePaymentId: session.payment_intent as string,
          paidAt: new Date(),
        },
        include: {
          rental: {
            include: {
              gpu: true,
              buyer: true,
            },
          },
        },
      });

      // Provision VM
      const vm = await vmOrchestrator.provisionVM({
        rentalId: payment.rental!.id,
        gpuId: payment.rental!.gpuId,
        gpuHostIP: payment.rental!.gpu.hostIP,
        proxmoxNode: payment.rental!.gpu.proxmoxNode,
      });

      // Generate SSH keypair
      await sshKeyService.generateKeypair({
        userId: payment.userId,
        rentalId: payment.rentalId!,
      });

      fastify.log.info(`VM provisioned for rental ${rentalId}`);
    }

    return reply.send({ received: true });
  });
}
