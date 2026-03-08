import { FastifyInstance } from 'fastify';
import hostStatsRoute from './stats';

export default async function hostRoutes(fastify: FastifyInstance) {
  await fastify.register(hostStatsRoute);
}
