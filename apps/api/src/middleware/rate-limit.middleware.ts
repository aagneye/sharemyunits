// Rate limiting is handled by @fastify/rate-limit plugin
// This file can be used for custom rate limiting logic if needed

export const rateLimitConfig = {
  '/api/auth/login': { max: 5, timeWindow: '15 minutes' },
  '/api/auth/register': { max: 3, timeWindow: '1 hour' },
  '/api/payment/webhook': { max: 1000, timeWindow: '1 minute' },
};
