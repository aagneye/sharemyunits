import { FastifyInstance } from 'fastify';
import listRoute from './list';
import registerRoute from './register';
import statsRoute from './stats';
import myGPUsRoute from './my-gpus';
import deleteGPURoute from './delete';
import updateGPUStatusRoute from './update-status';

export default async function gpuRoutes(fastify: FastifyInstance) {
  await fastify.register(listRoute);
  await fastify.register(registerRoute);
  await fastify.register(statsRoute);
  await fastify.register(myGPUsRoute);
  await fastify.register(deleteGPURoute);
  await fastify.register(updateGPUStatusRoute);
}
