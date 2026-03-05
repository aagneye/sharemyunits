import { FastifyRequest, FastifyReply } from 'fastify';

type UserRole = 'BUYER' | 'HOST' | 'ADMIN';

interface UserPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserPayload;
    
    if (!user || !allowedRoles.includes(user.role)) {
      reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      return;
    }
  };
}
