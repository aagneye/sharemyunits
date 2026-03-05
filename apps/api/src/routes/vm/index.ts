import { FastifyInstance } from 'fastify';
import provisionRoute from './provision';
import terminateRoute from './terminate';
import statusRoute from './status';
import sshCredentialsRoute from './ssh-credentials';

export default async function vmRoutes(fastify: FastifyInstance) {
  await fastify.register(provisionRoute);
  await fastify.register(terminateRoute);
  await fastify.register(statusRoute);
  await fastify.register(sshCredentialsRoute);
}
