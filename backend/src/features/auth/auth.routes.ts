import type { FastifyInstance } from 'fastify';
import { signupHandler, loginHandler, getMeHandler, refreshHandler, logoutHandler } from './auth.controllers.js';
import { authenticate } from './auth.middleware.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/signup', signupHandler);
  fastify.post('/login', loginHandler);
  fastify.post('/refresh', refreshHandler);
  fastify.post('/logout', logoutHandler);

  // Protected routes (require authentication)
  fastify.get('/me', { preHandler: authenticate }, getMeHandler);
}
