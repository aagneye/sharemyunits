import { FastifyInstance } from 'fastify';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';

export default async function refreshRoute(fastify: FastifyInstance) {
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token required' });
    }

    try {
      const decoded = fastify.jwt.verify(refreshToken) as {
        userId: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        return reply.status(401).send({ error: 'Invalid token type' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return reply.status(401).send({ error: 'User not found' });
      }

      const accessToken = fastify.jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      return reply.send({ accessToken });
    } catch (err) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });
}
