import { FastifyInstance } from 'fastify';
import checkoutRoute from './checkout';
import webhookRoute from './webhook';
import payoutRoute from './payout';

export default async function paymentRoutes(fastify: FastifyInstance) {
  await fastify.register(checkoutRoute);
  await fastify.register(webhookRoute);
  await fastify.register(payoutRoute);
}
