import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../server';
import { verifyJWT } from '../../middleware/auth.middleware';

const paramsSchema = z.object({
  keyId: z.string(),
});

export default async function sshCredentialsRoute(fastify: FastifyInstance) {
  fastify.get(
    '/ssh-credentials/:keyId',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { keyId } = paramsSchema.parse(request.params);
      const user = request.user as { userId: string };

      const sshKey = await prisma.sSHKey.findUnique({
        where: { id: keyId },
        include: {
          user: true,
        },
      });

      if (!sshKey) {
        return reply.status(404).send({ error: 'SSH key not found' });
      }

      if (sshKey.userId !== user.userId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      if (sshKey.downloaded) {
        return reply.status(410).send({ error: 'Key already downloaded and deleted' });
      }

      // Mark as downloaded and delete private key
      await prisma.sSHKey.update({
        where: { id: keyId },
        data: {
          downloaded: true,
          downloadedAt: new Date(),
          privateKey: '', // Delete private key
        },
      });

      // Return private key for download (one-time)
      reply.header('Content-Type', 'application/x-pem-file');
      reply.header('Content-Disposition', `attachment; filename="gpu-${sshKey.fingerprint}.pem"`);
      return reply.send(sshKey.privateKey);
    }
  );
}
