import { FastifyInstance } from 'fastify';
import registerRoute from './register';
import loginRoute from './login';
import refreshRoute from './refresh';

export default async function authRoutes(fastify: FastifyInstance) {
  await fastify.register(registerRoute);
  await fastify.register(loginRoute);
  await fastify.register(refreshRoute);
}
