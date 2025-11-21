import bcrypt from 'bcrypt';
import { prisma } from '../../lib/database.js';
import type { SignupInput, LoginInput } from './auth.models.js';
import { FastifyJWT } from '@fastify/jwt';

const SALT_ROUNDS = 12;
const STARTING_CREDITS = 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string | null;
  creditBalance: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user
 */
export async function registerUser(
  input: SignupInput,
  jwt: FastifyJWT['jwt']
): Promise<{ user: UserProfile; tokens: AuthTokens }> {
  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username: input.username },
  });

  if (existingUsername) {
    throw new Error('Username already taken');
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user with starting credits
  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      name: input.name,
      passwordHash,
      creditBalance: STARTING_CREDITS,
    },
  });

  // Create initial credit transaction for signup bonus
  await prisma.creditTransaction.create({
    data: {
      userId: user.id,
      amount: STARTING_CREDITS,
      transactionType: 'signup_bonus',
      balanceAfter: STARTING_CREDITS,
    },
  });

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Store refresh token in database
  const refreshTokenHash = await hashPassword(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      creditBalance: Number(user.creditBalance),
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

/**
 * Authenticate user login
 */
export async function authenticateUser(
  input: LoginInput,
  jwt: FastifyJWT['jwt']
): Promise<{ user: UserProfile; tokens: AuthTokens }> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Store refresh token in database
  const refreshTokenHash = await hashPassword(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      creditBalance: Number(user.creditBalance),
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      creditBalance: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    creditBalance: Number(user.creditBalance),
  };
}
