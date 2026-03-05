import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';

const oauthSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  provider: z.enum(['google', 'github']),
  providerId: z.string(),
});

export default async function oauthRoute(fastify: FastifyInstance) {
  fastify.post('/oauth', async (request, reply) => {
    const body = oauthSchema.parse(request.body);

    let user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          passwordHash: '',
          role: 'BUYER',
        },
      });
    }

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
