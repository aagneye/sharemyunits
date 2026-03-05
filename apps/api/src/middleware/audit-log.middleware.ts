import { FastifyRequest } from 'fastify';
import { prisma } from '../server';

interface UserPayload {
  userId: string;
  role: string;
  email: string;
}

export async function auditLog(
  request: FastifyRequest,
  action: string,
  details?: Record<string, any>
) {
  try {
    const user = request.user as UserPayload | undefined;
    
    // In production, you'd want a proper AuditLog model
    console.log('[AUDIT]', {
      timestamp: new Date().toISOString(),
      userId: user?.userId,
      email: user?.email,
      action,
      method: request.method,
      path: request.url,
      details,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
