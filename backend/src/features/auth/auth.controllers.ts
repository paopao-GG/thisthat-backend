import type { FastifyRequest, FastifyReply } from 'fastify';
import { signupSchema, loginSchema } from './auth.models.js';
import * as authService from './auth.services.js';

/**
 * Handle user signup
 */
export async function signupHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Validate input
    const input = signupSchema.parse(request.body);

    // Register user
    const result = await authService.registerUser(input, request.server.jwt);

    return reply.status(201).send({
      success: true,
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken, // Include refresh token in response
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error.message === 'Email already registered' || error.message === 'Username already taken') {
      return reply.status(409).send({
        success: false,
        error: error.message,
      });
    }

    request.log.error({ error, stack: error.stack }, 'Signup error');
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * Handle user login
 */
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Validate input
    const input = loginSchema.parse(request.body);

    // Authenticate user
    const result = await authService.authenticateUser(input, request.server.jwt);

    return reply.send({
      success: true,
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken, // Include refresh token in response
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error.message === 'Invalid email or password') {
      return reply.status(401).send({
        success: false,
        error: error.message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to login',
    });
  }
}

/**
 * Get current user profile
 */
export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any)?.userId;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    const user = await authService.getUserProfile(userId);
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return reply.send({
      success: true,
      user,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get user profile',
    });
  }
}

/**
 * Refresh access token
 */
export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { refreshToken } = request.body as { refreshToken?: string };
    
    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const result = await authService.refreshAccessToken(refreshToken, request.server.jwt);

    return reply.send({
      success: true,
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    if (error.message === 'Invalid or expired refresh token') {
      return reply.status(401).send({
        success: false,
        error: error.message,
      });
    }

    request.log.error({ error, stack: error.stack }, 'Refresh token error');
    return reply.status(500).send({
      success: false,
      error: 'Failed to refresh token',
    });
  }
}

/**
 * Logout user
 */
export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { refreshToken } = request.body as { refreshToken?: string };
    
    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: 'Refresh token is required',
      });
    }

    await authService.logoutUser(refreshToken);

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    request.log.error({ error, stack: error.stack }, 'Logout error');
    return reply.status(500).send({
      success: false,
      error: 'Failed to logout',
    });
  }
}