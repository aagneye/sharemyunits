import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const checkoutSchema = z.object({
  rentalId: z.string(),
});

export default async function checkoutRoute(fastify: FastifyInstance) {
  fastify.post(
    '/checkout',
    { preHandler: [verifyJWT, requireRole('BUYER', 'ADMIN')] },
    async (request, reply) => {
      const body = checkoutSchema.parse(request.body);
      const user = request.user as { userId: string };

      const rental = await prisma.rental.findUnique({
        where: { id: body.rentalId },
        include: { gpu: true },
      });

      if (!rental) {
        return reply.status(404).send({ error: 'Rental not found' });
      }

      if (rental.buyerId !== user.userId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `GPU Rental - ${rental.gpu.name}`,
                description: `${rental.gpu.model} for ${rental.endTime.getTime() - rental.startTime.getTime()}ms`,
              },
              unit_amount: Math.round(rental.totalCostUSD * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/buyer/my-rentals?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/buyer/marketplace?canceled=true`,
        metadata: {
          rentalId: rental.id,
          userId: user.userId,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          userId: user.userId,
          rentalId: rental.id,
          amountUSD: rental.totalCostUSD,
          status: 'PENDING',
        },
      });

      return reply.send({ sessionId: session.id, url: session.url });
    }
  );
}
