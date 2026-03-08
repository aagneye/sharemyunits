import { FastifyInstance } from 'fastify';
import myRentalsRoute from './my-rentals';

export default async function rentalRoutes(fastify: FastifyInstance) {
  await fastify.register(myRentalsRoute);
}
