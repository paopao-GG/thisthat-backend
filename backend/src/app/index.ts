import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { connectMongoDB, closeMongoDB } from '../lib/mongodb.js';
import marketDataRoutes from '../features/fetching/market-data/market-data.routes.js';
import eventDataRoutes from '../features/fetching/event-data/event-data.routes.js';
import eventMarketGroupRoutes from '../features/fetching/event-market-group/event-market-group.routes.js';
import authRoutes from '../features/auth/auth.routes.js';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS plugin
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
  credentials: true,
});

// Register JWT plugin
await fastify.register(jwt, {
  secret: process.env.JWT_ACCESS_SECRET || 'your-secret-key-change-in-production',
});

// Basic health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API routes
fastify.get('/api/hello', async (request, reply) => {
  return { message: 'Hello from TypeScript Fastify!' };
});

// Register Phase 1 routes
await fastify.register(marketDataRoutes, { prefix: '/api/v1/markets' });
await fastify.register(eventDataRoutes, { prefix: '/api/v1/events' });
await fastify.register(eventMarketGroupRoutes, { prefix: '/api/v1/event-market-groups' });

// Register Auth routes
await fastify.register(authRoutes, { prefix: '/api/v1/auth' });

// Error handling
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({ error: 'Something went wrong!' });
});

// Start server
const start = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    fastify.log.info('✅ MongoDB connected successfully');

    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    fastify.log.info('🛑 Shutting down gracefully...');
    await fastify.close();
    await closeMongoDB();
    fastify.log.info('✅ Server and database connections closed');
    process.exit(0);
  } catch (err) {
    fastify.log.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();