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
  availableCredits: number;
  expendedCredits: number;
  consecutiveDaysOnline: number;
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

  // Create user with starting credits and economy fields
  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      name: input.name,
      passwordHash,
      creditBalance: STARTING_CREDITS,
      availableCredits: STARTING_CREDITS, // Initialize available credits
      expendedCredits: 0, // Initialize expended credits
      consecutiveDaysOnline: 1, // Start with 1 day
      lastLoginAt: new Date(), // Set initial login time
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
      availableCredits: Number(user.availableCredits),
      expendedCredits: Number(user.expendedCredits),
      consecutiveDaysOnline: user.consecutiveDaysOnline,
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

  // Update last login timestamp and check consecutive days
  const now = new Date();
  const lastLoginAt = user.lastLoginAt;
  
  let consecutiveDays = user.consecutiveDaysOnline;
  if (lastLoginAt) {
    const daysSinceLastLogin = Math.floor(
      (now.getTime() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastLogin === 0) {
      // Same day login - maintain streak
      consecutiveDays = user.consecutiveDaysOnline;
    } else if (daysSinceLastLogin === 1) {
      // Next day - increment streak
      consecutiveDays = user.consecutiveDaysOnline + 1;
    } else {
      // Streak broken - reset to 1
      consecutiveDays = 1;
    }
  } else {
    // First login
    consecutiveDays = 1;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      updatedAt: now,
      lastLoginAt: now,
      consecutiveDaysOnline: consecutiveDays,
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      creditBalance: Number(user.creditBalance),
      availableCredits: Number(user.availableCredits),
      expendedCredits: Number(user.expendedCredits),
      consecutiveDaysOnline: user.consecutiveDaysOnline,
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
      availableCredits: true,
      expendedCredits: true,
      consecutiveDaysOnline: true,
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
    availableCredits: Number(user.availableCredits),
    expendedCredits: Number(user.expendedCredits),
    consecutiveDaysOnline: user.consecutiveDaysOnline,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  jwt: FastifyJWT['jwt']
): Promise<{ accessToken: string }> {
  // Find refresh token in database
  const refreshTokens = await prisma.refreshToken.findMany({
    where: {
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  // Find matching token by comparing hashes
  let matchedToken = null;
  for (const token of refreshTokens) {
    const isValid = await verifyPassword(refreshToken, token.tokenHash);
    if (isValid) {
      matchedToken = token;
      break;
    }
  }

  if (!matchedToken) {
    throw new Error('Invalid or expired refresh token');
  }

  // Generate new access token
  const accessToken = jwt.sign(
    { userId: matchedToken.user.id, email: matchedToken.user.email },
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  return { accessToken };
}

/**
 * Logout user by invalidating refresh token
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  // Find and delete refresh token
  const refreshTokens = await prisma.refreshToken.findMany({
    where: {
      expiresAt: { gt: new Date() },
    },
  });

  // Find matching token and delete it
  for (const token of refreshTokens) {
    const isValid = await verifyPassword(refreshToken, token.tokenHash);
    if (isValid) {
      await prisma.refreshToken.delete({
        where: { id: token.id },
      });
      return;
    }
  }

  // Token not found, but don't throw error (idempotent)
}