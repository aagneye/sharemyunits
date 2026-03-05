import { FastifyInstance } from 'fastify';
import listRoute from './list';
import registerRoute from './register';
import statsRoute from './stats';

export default async function gpuRoutes(fastify: FastifyInstance) {
  await fastify.register(listRoute);
  await fastify.register(registerRoute);
  await fastify.register(statsRoute);
}
