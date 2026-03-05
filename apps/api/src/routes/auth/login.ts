import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function loginRoute(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(body.password, user.passwordHash);

    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = fastify.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = fastify.jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });
}
