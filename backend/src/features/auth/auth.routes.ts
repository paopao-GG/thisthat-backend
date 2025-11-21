import type { FastifyInstance } from 'fastify';
import { signupHandler, loginHandler, getMeHandler } from './auth.controllers.js';
import { authenticate } from './auth.middleware.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/signup', signupHandler);
  fastify.post('/login', loginHandler);

  // Protected routes (require authentication)
  fastify.get('/me', { preHandler: authenticate }, getMeHandler);
}
