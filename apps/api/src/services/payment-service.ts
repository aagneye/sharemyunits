import Stripe from 'stripe';
import { prisma } from '../server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

class PaymentService {
  /**
   * Creates a Stripe checkout session
   */
  async createCheckoutSession(params: {
    rentalId: string;
    amountUSD: number;
    successUrl: string;
    cancelUrl: string;
  }) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'GPU Rental',
            },
            unit_amount: Math.round(params.amountUSD * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        rentalId: params.rentalId,
      },
    });

    return session;
  }

  /**
   * Processes a payout to a host
   */
  async processPayout(params: { hostId: string; amountUSD: number }) {
    // In production, this would use Stripe Connect
    // For now, just create a payout record
    const payout = await prisma.payout.create({
      data: {
        hostId: params.hostId,
        amountUSD: params.amountUSD,
        status: 'PROCESSING',
      },
    });

    // TODO: Integrate with Stripe Connect for actual payouts

    return payout;
  }
}

export const paymentService = new PaymentService();
