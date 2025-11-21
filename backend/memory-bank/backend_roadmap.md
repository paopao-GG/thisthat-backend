# Backend Development Roadmap

**Project:** THISTHAT Backend API (V1 Only)
**Status:** Phase 1 Complete ✅ | Phase 2 In Progress
**Last Updated:** 2025-01-XX (Memory Bank Update)

---

## Overview

This roadmap outlines the phased development approach for the THISTHAT backend API. The focus is strictly on **V1 features only** - a credits-based prediction market platform with Polymarket integration.

**V1 Scope:** Credits system, authentication, market data fetching, betting, leaderboards, daily rewards
**V1 Exclusions:** Wallet integration, real-money betting, social features, creator-driven markets

---

## Phase 1: Polymarket Data Fetching ✅ COMPLETE

**Duration:** 1 day (2025-11-18)
**Status:** ✅ 100% Complete (Updated: 2025-01-XX)
**Objective:** Fetch Polymarket market and event data → validate, normalize, sanitize, and flatten → save to MongoDB for testing → develop API routes for BFF integration → test API routes to see response output

**Note:** Events endpoint was initially returning 404 but has been fixed. Now using Gamma API (gamma-api.polymarket.com) instead of CLOB API. Both markets and events endpoints are fully functional.

### ✅ Completed Tasks

#### 1. Data Fetching with Gamma (API Client)
- ✅ [lib/polymarket-client.ts](../src/lib/polymarket-client.ts) - Polymarket CLOB API integration
- ✅ GET /markets endpoint integration with axios
- ✅ Response unwrapping (`{data: [...]}` format handling)
- ✅ Error handling and retry logic
- ✅ TypeScript interfaces for PolymarketMarket and PolymarketEvent

#### 2. Validation, Normalization, Sanitization & Flattening
- ✅ **Validation:** Zod schemas in [market-data.models.ts](../src/features/fetching/market-data/market-data.models.ts)
- ✅ **Normalization:** `normalizeMarket()` function in [market-data.services.ts](../src/features/fetching/market-data/market-data.services.ts)
  - Extracts THIS/THAT binary options from outcomes
  - Calculates odds from token prices
  - Determines status (active/closed/archived)
  - Flattens nested data structures
- ✅ **Sanitization:** Array validation, type checking, safe defaults
- ✅ **Flattening:** Converts nested Polymarket format to flat FlattenedMarket schema

#### 3. Save to MongoDB for Testing
- ✅ [lib/mongodb.ts](../src/lib/mongodb.ts) - MongoDB connection manager
- ✅ Singleton pattern for connection pooling
- ✅ Upsert logic (update if exists, insert if new)
- ✅ **947 markets** successfully saved to `thisthat_test.markets` collection
- ✅ Graceful shutdown handling

#### 4. Develop API Routes for BFF Integration
- ✅ **POST** `/api/v1/markets/fetch` - Fetch and save markets from Polymarket
  - Query params: `?active=true&limit=100`
  - Returns: `{success: true, message: "...", data: {saved: 100, errors: 0}}`
- ✅ **GET** `/api/v1/markets` - Query markets with filters
  - Query params: `?status=active&category=sports&featured=true&limit=100&skip=0`
  - Returns: `{success: true, count: 100, data: [...]}`
- ✅ **GET** `/api/v1/markets/stats` - Get market statistics
  - Returns: `{totalMarkets, activeMarkets, closedMarkets, archivedMarkets, featuredMarkets, categoryCounts}`
- ✅ Route registration in [src/app/index.ts](../src/app/index.ts)

#### 5. Test API Routes to See Response Output
- ✅ [scripts/test-api.ps1](../scripts/test-api.ps1) - PowerShell test script with 6 test cases
  - Health check
  - Fetch markets from Polymarket
  - Get market statistics
  - Get markets list with sample data
  - Closed markets filter test
  - Pagination test
- ✅ [scripts/view-database.ps1](../scripts/view-database.ps1) - Database viewer script
- ✅ [scripts/view-events-only.ps1](../scripts/view-events-only.ps1) - Events-only viewer script
- ✅ Manual testing with curl/Invoke-RestMethod
- ✅ All endpoints verified and working (markets + events)
- ✅ Events endpoint fixed (was 404, now using Gamma API)

#### 6. Unit Testing ✅ COMPLETE (2025-01-XX)
- ✅ Vitest test framework configured
- ✅ **116 unit tests** covering all Phase 1 functionality:
  - PolymarketClient: 24 tests (API client methods)
  - Market Data Services: 21 tests (normalization, fetching, querying)
  - Event Data Services: 21 tests (normalization, fetching, querying)
  - Market Data Controllers: 18 tests (HTTP request/response handling)
  - Event Data Controllers: 18 tests (HTTP request/response handling)
  - Integration Tests: 14 tests (full API flow)
- ✅ Test coverage: 97%+ statements, 93%+ branches, 94%+ functions
- ✅ All tests passing ✅
- ✅ Test documentation: `docs/UNIT_TESTING_GUIDE.md`, `docs/TEST_COVERAGE_SUMMARY.md`

### Architecture Implemented

```
┌─────────────────────┐
│  Polymarket API     │
│  (clob.polymarket)  │
└──────────┬──────────┘
           │ HTTP GET
           ▼
┌─────────────────────┐
│ Polymarket Client   │
│ (lib/polymarket)    │
│ - Response unwrap   │
│ - Error handling    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Market Service     │
│ (market-data.svc)   │
│ - Normalize data    │
│ - Validate (Zod)    │
│ - Flatten structure │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    MongoDB          │
│  (markets coll.)    │
│  947 documents      │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Fastify Routes     │
│ /api/v1/markets/*   │
│ - Controllers       │
│ - Response format   │
└─────────────────────┘
```

### Key Files Created

| File | Purpose | Lines |
|------|---------|-------|
| [lib/mongodb.ts](../src/lib/mongodb.ts) | MongoDB connection manager | 42 |
| [lib/polymarket-client.ts](../src/lib/polymarket-client.ts) | Polymarket API client | 120 |
| [market-data.models.ts](../src/features/fetching/market-data/market-data.models.ts) | Zod schemas & TypeScript types | 75 |
| [market-data.services.ts](../src/features/fetching/market-data/market-data.services.ts) | Data normalization & DB operations | 182 |
| [market-data.controllers.ts](../src/features/fetching/market-data/market-data.controllers.ts) | HTTP request handlers | 98 |
| [market-data.routes.ts](../src/features/fetching/market-data/market-data.routes.ts) | Fastify route registration | 14 |
| [event-data.*](../src/features/fetching/event-data/) | Event data structure | 170 |
| [scripts/test-api.ps1](../scripts/test-api.ps1) | PowerShell test script | 104 |
| [__tests__/polymarket-client.test.ts](../src/lib/__tests__/polymarket-client.test.ts) | PolymarketClient unit tests | 24 tests |
| [__tests__/market-data.services.test.ts](../src/features/fetching/market-data/__tests__/market-data.services.test.ts) | Market services unit tests | 21 tests |
| [__tests__/event-data.services.test.ts](../src/features/fetching/event-data/__tests__/event-data.services.test.ts) | Event services unit tests | 21 tests |
| [__tests__/market-data.controllers.test.ts](../src/features/fetching/market-data/__tests__/market-data.controllers.test.ts) | Market controllers unit tests | 18 tests |
| [__tests__/event-data.controllers.test.ts](../src/features/fetching/event-data/__tests__/event-data.controllers.test.ts) | Event controllers unit tests | 18 tests |
| [__tests__/integration/phase1-api-routes.test.ts](../src/__tests__/integration/phase1-api-routes.test.ts) | Integration tests | 14 tests |

### Errors Resolved

1. ✅ **TypeScript Build Errors** - Pino logger format, Zod validation arguments
2. ✅ **Polymarket API Response Format** - Response unwrapping `{data: [...]}`
3. ✅ **Polymarket Events Endpoint 404** - Documented as API limitation
4. ✅ **Docker MongoDB Connection** - Port conflicts, container management
5. ✅ **Port Already in Use (EADDRINUSE)** - Changed from 3000 to 3001

### Testing Results

✅ **All 6 API test cases passing:**
1. Health check - Server healthy
2. Fetch markets - 947 markets saved
3. Market statistics - All counts accurate
4. Get markets - Returns paginated results
5. Closed markets filter - Filters working
6. Pagination - Skip/limit working

✅ **Unit Testing Complete (2025-01-XX):**
- **116 unit tests** covering all Phase 1 functionality
- **97%+ code coverage** (statements, branches, functions)
- All tests passing ✅
- Test files organized in `__tests__/` directories
- Integration tests for full API flow
- See `docs/TEST_COVERAGE_SUMMARY.md` for details

### Phase 1 Deliverables ✅

- ✅ Working Polymarket API integration
- ✅ Data validation, normalization, and flattening pipeline
- ✅ MongoDB storage with 947 markets
- ✅ 8 RESTful API endpoints for BFF integration (markets + events)
- ✅ Comprehensive test script (PowerShell)
- ✅ **Complete unit test suite** (116 tests, 97%+ coverage)
- ✅ **Clean folder structure** (docs/, scripts/ organization)
- ✅ Full documentation of errors and solutions

---

## Phase 2: Authentication & Credit System 🔄 IN PROGRESS

**Duration:** 4-6 days
**Status:** 🔄 Partially Complete (Signup/Login done, Refresh/Logout pending)
**Last Updated:** 2025-01-XX
**Objective:** Implement authentication with JWT, database persistence, and automated daily credit rewards system

**Note:** Originally planned to use better-auth, but implemented custom JWT solution with @fastify/jwt instead.

### Overview

Phase 2 focuses on building a secure authentication system and the foundational credit economy:
1. **Authentication** - User registration/login with better-auth and JWT
2. **Database Persistence** - Save user auth data to PostgreSQL
3. **Credit System** - Automated daily credit distribution via node-cron
4. **Credit Economics** - Define rules, limits, and transaction tracking

---

### Tasks

#### 2.1 JWT Setup & Integration ✅ COMPLETE (2025-01-XX)
- [x] Install JWT dependencies ✅ (`@fastify/jwt` already installed)
- [x] Configure JWT plugin in Fastify ✅ (src/app/index.ts)
- [x] Set up authentication with email/password ✅
- [x] Configure JWT secret from environment ✅
- [x] Create Prisma client singleton ✅ (src/lib/database.ts)
- [x] Update User model with `name` field ✅ (prisma/schema.prisma)
- [ ] Unit tests for auth configuration ⏳

#### 2.2 Authentication Endpoints ✅ PARTIALLY COMPLETE (2025-01-XX)

- [x] **POST /api/v1/auth/signup** - User registration ✅
  - [x] Validate email format and uniqueness ✅
  - [x] Validate username uniqueness (3-50 chars, alphanumeric + underscores) ✅
  - [x] Validate password strength (min 8 chars) ✅
  - [x] Validate name field (1-100 chars) ✅
  - [x] Hash password with bcrypt (12 rounds) ✅
  - [x] Create user record with 1000 starting credits ✅
  - [x] Create signup_bonus credit transaction ✅
  - [x] Generate JWT access + refresh tokens ✅
  - [x] Store refresh token in database ✅
  - [x] Return tokens and user profile ✅
  - [ ] Rate limit: 5 requests/hour per IP ⏳
  - [ ] Unit tests ⏳

- [x] **POST /api/v1/auth/login** - User login ✅
  - [x] Validate credentials (email + password) ✅
  - [x] Verify password with bcrypt ✅
  - [x] Generate JWT access token (15 min expiry) ✅
  - [x] Generate JWT refresh token (7 days expiry) ✅
  - [x] Store refresh token in database ✅
  - [x] Update user timestamp ✅
  - [x] Return tokens and user profile ✅
  - [ ] Rate limit: 10 requests/hour per IP ⏳
  - [ ] Unit tests ⏳

- [ ] **POST /api/v1/auth/refresh** - Refresh access token
  - [ ] Validate refresh token from request
  - [ ] Check token exists in database
  - [ ] Generate new access token
  - [ ] Optionally rotate refresh token
  - [ ] Return new access token
  - [ ] Unit tests

- [ ] **POST /api/v1/auth/logout** - User logout
  - [ ] Invalidate refresh token in database
  - [ ] Clear session data
  - [ ] Return success response
  - [ ] Unit tests

#### 2.3 JWT Middleware Implementation ✅ COMPLETE (2025-01-XX)
- [x] Create authentication middleware ✅ (src/features/auth/auth.middleware.ts)
- [x] Verify JWT access token on protected routes ✅
- [x] Extract user ID from token payload ✅
- [x] Attach user object to request context ✅
- [x] Handle expired tokens (return 401) ✅
- [x] Handle invalid tokens (return 401) ✅
- [x] Handle missing tokens (return 401) ✅
- [x] Add middleware to protected routes ✅ (GET /me uses preHandler)
- [ ] Unit tests for middleware ⏳
- [ ] Integration tests for auth flow ⏳

#### 2.4 Database Schema & Prisma Setup ✅ PARTIALLY COMPLETE (2025-01-XX)
- [x] Install Prisma CLI and client ✅ (already installed)
- [x] Prisma schema exists ✅ (prisma/schema.prisma)
- [x] Prisma client singleton created ✅ (src/lib/database.ts)
- [x] User model updated with `name` field ✅
- [ ] Run database migrations ⚠️ (needs `npx prisma db push` or `npx prisma migrate dev`)
- [x] Define `users` table schema ✅:
  ```prisma
  model User {
    id                  String   @id @default(uuid())
    username            String   @unique
    email               String   @unique
    password_hash       String
    credit_balance      Decimal  @default(1000.00) @db.Decimal(18, 2)
    total_volume        Decimal  @default(0.00) @db.Decimal(18, 2)
    overall_pnl         Decimal  @default(0.00) @db.Decimal(18, 2)
    rank_by_pnl         Int?
    rank_by_volume      Int?
    last_daily_reward_at DateTime?
    last_login_at       DateTime?
    created_at          DateTime @default(now())
    updated_at          DateTime @updatedAt

    @@index([overall_pnl])
    @@index([total_volume])
  }
  ```
- [ ] Define `credit_transactions` table:
  ```prisma
  model CreditTransaction {
    id          String   @id @default(uuid())
    user_id     String
    type        String   // 'daily_reward', 'bet_placed', 'bet_payout', 'bet_refund'
    amount      Decimal  @db.Decimal(18, 2)
    description String?
    created_at  DateTime @default(now())

    @@index([user_id])
    @@index([created_at])
  }
  ```
- [ ] Define `refresh_tokens` table:
  ```prisma
  model RefreshToken {
    id         String   @id @default(uuid())
    user_id    String
    token      String   @unique
    expires_at DateTime
    created_at DateTime @default(now())

    @@index([user_id])
    @@index([expires_at])
  }
  ```
- [ ] Generate Prisma Client
  ```bash
  npx prisma generate
  ```
- [ ] Create initial migration
  ```bash
  npx prisma migrate dev --name init
  ```

#### 2.5 PostgreSQL Setup
- [ ] Install PostgreSQL 14+ locally
- [ ] Create `thisthat_v1` database
- [ ] Configure DATABASE_URL in .env
- [ ] Run Prisma migrations
- [ ] Test database connection
- [ ] Set up connection pooling (Prisma default)
- [ ] Verify tables created successfully

#### 2.6 Test Auth Service
- [ ] Unit tests for registration logic
- [ ] Unit tests for login logic
- [ ] Unit tests for token refresh
- [ ] Unit tests for logout
- [ ] Integration test: Full auth flow (register → login → refresh → logout)
- [ ] Test rate limiting behavior
- [ ] Test validation errors (invalid email, weak password, etc.)
- [ ] Test duplicate username/email errors
- [ ] Test JWT expiry handling
- [ ] Load test: 100 concurrent registrations

#### 2.7 Daily Credit Reward System (node-cron)
- [ ] Install node-cron
  ```bash
  npm install node-cron
  npm install -D @types/node-cron
  ```
- [ ] Create `src/jobs/daily-rewards.job.ts`
- [ ] Implement daily credit distribution logic:
  ```typescript
  // Pseudo-code
  async function distributeDailyCredits() {
    // Find all users who are eligible (signed up, not claimed today)
    const eligibleUsers = await prisma.user.findMany({
      where: {
        OR: [
          { last_daily_reward_at: null },
          { last_daily_reward_at: { lt: startOfToday() } }
        ]
      }
    });

    for (const user of eligibleUsers) {
      // Credit 100 credits
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            credit_balance: { increment: 100 },
            last_daily_reward_at: new Date()
          }
        }),
        prisma.creditTransaction.create({
          data: {
            user_id: user.id,
            type: 'daily_reward',
            amount: 100,
            description: 'Daily login reward'
          }
        })
      ]);
    }
  }
  ```
- [ ] Schedule cron job to run at 00:00 UTC daily
  ```typescript
  cron.schedule('0 0 * * *', distributeDailyCredits, {
    timezone: 'UTC'
  });
  ```
- [ ] Add logging for cron job execution
- [ ] Handle errors gracefully (retry logic)
- [ ] Unit tests for credit distribution logic
- [ ] Test cron job scheduling (manual trigger)

#### 2.8 Credit Economics Rules
- [ ] Define starting balance: **1000 credits** (on registration)
- [ ] Define daily reward: **100 credits** (at 00:00 UTC)
- [ ] Define bet limits:
  - [ ] Minimum bet: **10 credits**
  - [ ] Maximum bet: **10,000 credits** per bet
  - [ ] No daily bet limit
- [ ] Define balance constraints:
  - [ ] Minimum balance: **0 credits** (cannot go negative)
  - [ ] Maximum balance: **1,000,000 credits**
- [ ] Implement balance validation functions
- [ ] Document credit flow:
  ```
  Sources: Registration (1000) + Daily Reward (100/day)
  Uses: Bet placement (deduct on bet)
  Returns: Bet payout (credit on win)
  ```
- [ ] Unit tests for all validation functions

#### 2.9 Credit Transaction Tracking
- [ ] Implement `logCreditTransaction()` helper function
- [ ] Log all credit movements:
  - [ ] 'daily_reward' - Daily login reward
  - [ ] 'bet_placed' - Credit deduction on bet
  - [ ] 'bet_payout' - Credit addition on win
  - [ ] 'bet_refund' - Credit refund on invalid market
  - [ ] 'signup_bonus' - Initial 1000 credits
- [ ] Ensure atomic transactions (wrap in Prisma.$transaction)
- [ ] Add audit trail for debugging
- [ ] Unit tests for transaction logging

#### 2.10 Manual Credit Reward Endpoint (Admin)
- [ ] **POST /api/v1/admin/credits/grant** - Grant credits to user (admin only)
  - [ ] Validate admin authentication
  - [ ] Accept user_id and amount
  - [ ] Credit user balance
  - [ ] Log transaction
  - [ ] Return success response
  - [ ] Unit tests

- [ ] **GET /api/v1/users/me/credits** - Get user credit balance
  - [ ] Return current balance
  - [ ] Return recent transactions (last 10)
  - [ ] Unit tests

---

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

#### Credits
- `GET /api/v1/users/me/credits` - Get credit balance and transactions
- `POST /api/v1/admin/credits/grant` - Grant credits (admin only)

---

### Database Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                   String    @id @default(uuid())
  username             String    @unique
  email                String    @unique
  password_hash        String
  credit_balance       Decimal   @default(1000.00) @db.Decimal(18, 2)
  total_volume         Decimal   @default(0.00) @db.Decimal(18, 2)
  overall_pnl          Decimal   @default(0.00) @db.Decimal(18, 2)
  rank_by_pnl          Int?
  rank_by_volume       Int?
  last_daily_reward_at DateTime?
  last_login_at        DateTime?
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt

  @@index([overall_pnl])
  @@index([total_volume])
  @@map("users")
}

model CreditTransaction {
  id          String   @id @default(uuid())
  user_id     String
  type        String
  amount      Decimal  @db.Decimal(18, 2)
  description String?
  created_at  DateTime @default(now())

  @@index([user_id])
  @@index([created_at])
  @@map("credit_transactions")
}

model RefreshToken {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique
  expires_at DateTime
  created_at DateTime @default(now())

  @@index([user_id])
  @@index([expires_at])
  @@map("refresh_tokens")
}
```

---

### Credit Economics

#### Starting Balance
- **1000 credits** on registration
- Recorded as 'signup_bonus' transaction

#### Daily Rewards
- **100 credits** per day at 00:00 UTC
- Automatic distribution via node-cron
- Only eligible if:
  - User has signed up
  - Has not claimed today
- Recorded as 'daily_reward' transaction

#### Bet Limits
- **Minimum bet:** 10 credits
- **Maximum bet:** 10,000 credits per bet
- No daily bet limit

#### Balance Constraints
- **Minimum balance:** 0 credits (no negative balances)
- **Maximum balance:** 1,000,000 credits
- All operations atomic (Prisma transactions)

#### Transaction Types
1. **signup_bonus** - Initial 1000 credits
2. **daily_reward** - Daily 100 credits
3. **bet_placed** - Deduct bet amount
4. **bet_payout** - Credit winnings
5. **bet_refund** - Refund cancelled bets

---

### Success Criteria

- ✅ Users can register with email/password
- ✅ Users can login and receive JWT tokens
- ✅ Access tokens expire after 15 minutes
- ✅ Refresh tokens work correctly
- ✅ JWT middleware protects routes
- ✅ User data persisted to PostgreSQL
- ✅ All auth endpoints have rate limiting
- ✅ All auth endpoints have unit tests
- ✅ Integration tests for full auth flow pass
- ✅ Daily credit rewards run automatically at 00:00 UTC
- ✅ Credit transactions logged for audit trail
- ✅ Credit balance validation prevents negative balances
- ✅ All credit operations are atomic

---

## Phase 3: Infrastructure & DevOps (Deferred)

**Duration:** 3-4 days
**Status:** ⏳ Not Started
**Objective:** Implement JWT-based authentication with email/password

### Tasks

#### 3.1 User Registration
- [ ] POST /api/v1/auth/register endpoint
- [ ] Validate email format and uniqueness
- [ ] Validate username uniqueness
- [ ] Hash password with bcrypt (cost: 12)
- [ ] Create user record with 1000 starting credits
- [ ] Generate JWT access + refresh tokens
- [ ] Return tokens in response
- [ ] Unit tests for registration

#### 3.2 User Login
- [ ] POST /api/v1/auth/login endpoint
- [ ] Validate credentials (email/username + password)
- [ ] Compare password hash with bcrypt
- [ ] Generate JWT access token (15 min expiry)
- [ ] Generate JWT refresh token (7 days expiry)
- [ ] Store refresh token in database
- [ ] Return tokens in response
- [ ] Rate limiting (10 requests/hour per IP)
- [ ] Unit tests for login

#### 3.3 Token Refresh
- [ ] POST /api/v1/auth/refresh endpoint
- [ ] Validate refresh token from request
- [ ] Check token in database
- [ ] Generate new access token
- [ ] Rotate refresh token (optional)
- [ ] Return new tokens
- [ ] Unit tests for refresh

#### 3.4 User Logout
- [ ] POST /api/v1/auth/logout endpoint
- [ ] Invalidate refresh token in database
- [ ] Return success response
- [ ] Unit tests for logout

#### 3.5 JWT Middleware
- [ ] Create authentication middleware
- [ ] Verify JWT access token
- [ ] Extract user ID from token
- [ ] Attach user to request object
- [ ] Handle expired tokens
- [ ] Handle invalid tokens
- [ ] Unit tests for middleware

#### 3.6 Rate Limiting
- [ ] Install @fastify/rate-limit
- [ ] Configure rate limits per endpoint
- [ ] `/auth/register`: 5 requests/hour per IP
- [ ] `/auth/login`: 10 requests/hour per IP
- [ ] Test rate limiting behavior

### API Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Success Criteria

- ✅ Users can register with email/password
- ✅ Users can login and receive JWT tokens
- ✅ Access tokens expire after 15 minutes
- ✅ Refresh tokens work correctly
- ✅ Rate limiting prevents brute force attacks
- ✅ All endpoints have unit tests
- ✅ Integration tests for full auth flow

---

## Phase 4: User Module

**Duration:** 2-3 days
**Status:** ⏳ Not Started
**Objective:** User profile management and credit tracking

### Tasks

#### 4.1 Get Current User
- [ ] GET /api/v1/users/me endpoint
- [ ] Return authenticated user's profile
- [ ] Include credit balance
- [ ] Include PnL and volume
- [ ] Include rank_by_pnl and rank_by_volume
- [ ] Unit tests

#### 4.2 Update User Profile
- [ ] PATCH /api/v1/users/me endpoint
- [ ] Allow updating username (if unique)
- [ ] Allow updating email (if unique)
- [ ] Validate input
- [ ] Unit tests

#### 4.3 Get User by ID
- [ ] GET /api/v1/users/:userId endpoint
- [ ] Return public user profile
- [ ] Exclude sensitive data (email, password)
- [ ] Include stats (PnL, volume, ranks)
- [ ] Unit tests

#### 4.4 Credit Balance Tracking
- [ ] Implement balance update logic
- [ ] Ensure atomic operations (transactions)
- [ ] Prevent negative balances
- [ ] Log all credit movements in credit_transactions
- [ ] Unit tests for balance operations

#### 4.5 PnL Calculation
- [ ] Calculate overall_pnl from bet history
- [ ] Update on bet placement
- [ ] Update on market resolution
- [ ] Cache in user record
- [ ] Unit tests

#### 4.6 Volume Tracking
- [ ] Calculate total_volume from bets
- [ ] Update on bet placement
- [ ] Cache in user record
- [ ] Unit tests

### API Endpoints

- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users/:userId` - Get user by ID

### Success Criteria

- ✅ Users can view their profile
- ✅ Users can update their profile
- ✅ Credit balance is always accurate
- ✅ PnL and volume calculations are correct
- ✅ All operations are atomic (no race conditions)
- ✅ All endpoints have unit tests

---

## Phase 5: Market Module (Production)

**Duration:** 3-4 days
**Status:** ⏳ Not Started
**Objective:** Migrate MongoDB markets to PostgreSQL with Prisma, add caching

### Tasks

#### 5.1 Market Data Migration
- [ ] Create Prisma migration for markets table
- [ ] Script to migrate 947 markets from MongoDB to PostgreSQL
- [ ] Verify data integrity
- [ ] Update market-data.services.ts to use Prisma
- [ ] Remove MongoDB dependencies

#### 5.2 Market Query Endpoints
- [ ] GET /api/v1/markets endpoint
- [ ] Support filters: status, category, featured
- [ ] Support pagination: limit, skip
- [ ] Support sorting: by volume, by end date
- [ ] Return normalized market data
- [ ] Unit tests

#### 5.3 Market Detail Endpoint
- [ ] GET /api/v1/markets/:id endpoint
- [ ] Return full market details
- [ ] Include current odds
- [ ] Include volume and liquidity
- [ ] Unit tests

#### 5.4 Redis Caching
- [ ] Cache market lists (TTL: 5 min)
- [ ] Cache market details (TTL: 1 min)
- [ ] Implement cache invalidation
- [ ] Test cache hit rates
- [ ] Unit tests for caching logic

#### 5.5 Market Ingestion Job
- [ ] Create scheduled job (every 5 minutes)
- [ ] Fetch new markets from Polymarket
- [ ] Update existing markets
- [ ] Handle market expiry
- [ ] Log job execution
- [ ] Unit tests

#### 5.6 Odds Synchronization
- [ ] Create polling job (every 30 seconds)
- [ ] Fetch latest odds from Polymarket
- [ ] Update market.this_odds and market.that_odds
- [ ] Only poll markets with open bets
- [ ] Unit tests

### API Endpoints

- `GET /api/v1/markets` - List markets with filters
- `GET /api/v1/markets/:id` - Get market details

### Success Criteria

- ✅ All 947 markets migrated to PostgreSQL
- ✅ Market endpoints return correct data
- ✅ Redis caching reduces DB load
- ✅ Market ingestion job runs reliably
- ✅ Odds synchronization keeps data fresh
- ✅ All endpoints have unit tests

---

## Phase 6: Betting Module

**Duration:** 4-5 days
**Status:** ⏳ Not Started
**Objective:** Implement bet placement, validation, and payout logic

### Tasks

#### 6.1 Bet Placement
- [ ] POST /api/v1/bets endpoint
- [ ] Validate market exists and is open
- [ ] Validate bet amount (10-10,000 credits)
- [ ] Check user balance atomically
- [ ] Calculate potential payout
- [ ] Deduct credits from balance
- [ ] Create bet record
- [ ] Log credit transaction
- [ ] Return bet confirmation
- [ ] Unit tests

#### 6.2 Bet History
- [ ] GET /api/v1/bets/me endpoint
- [ ] Return user's bet history
- [ ] Support pagination
- [ ] Support filters: status, market
- [ ] Include market details
- [ ] Unit tests

#### 6.3 Bet Detail
- [ ] GET /api/v1/bets/:id endpoint
- [ ] Return full bet details
- [ ] Include market info
- [ ] Include payout info (if resolved)
- [ ] Unit tests

#### 6.4 Atomic Transactions
- [ ] Wrap bet placement in database transaction
- [ ] Ensure balance check + deduction is atomic
- [ ] Handle race conditions (optimistic locking)
- [ ] Test concurrent bets
- [ ] Load testing with 100+ concurrent bets

#### 6.5 Payout Calculation
- [ ] Implement payout formula based on Polymarket odds
- [ ] `payout = bet_amount * (1 / odds)`
- [ ] Round to 2 decimal places
- [ ] Store expected_payout on bet creation
- [ ] Unit tests for various odds

#### 6.6 Market Resolution
- [ ] Create market resolution service
- [ ] Fetch resolution from Polymarket
- [ ] Update market status to 'closed'
- [ ] Set market.resolution ('this' or 'that')
- [ ] Trigger payout processing
- [ ] Unit tests

#### 6.7 Bet Payout Processing
- [ ] Query all pending bets for resolved market
- [ ] For winning bets:
  - [ ] Set status to 'won'
  - [ ] Credit user balance with actual_payout
  - [ ] Update user overall_pnl (+profit)
  - [ ] Log credit transaction
- [ ] For losing bets:
  - [ ] Set status to 'lost'
  - [ ] Update user overall_pnl (-amount)
- [ ] For invalid resolutions:
  - [ ] Set status to 'cancelled'
  - [ ] Refund bet amount
  - [ ] Log credit transaction
- [ ] Batch processing for performance
- [ ] Unit tests

### API Endpoints

- `POST /api/v1/bets` - Place a bet
- `GET /api/v1/bets/me` - Get user's bets
- `GET /api/v1/bets/:id` - Get bet details

### Success Criteria

- ✅ Users can place bets on open markets
- ✅ Balance checks are atomic (no double-spending)
- ✅ Payout calculations match Polymarket odds
- ✅ Bets are resolved correctly when markets close
- ✅ Winning users receive payouts automatically
- ✅ Race conditions are handled correctly
- ✅ All endpoints have unit tests
- ✅ Load testing passes with 100+ concurrent bets

---

## Phase 7: Leaderboard Module

**Duration:** 2-3 days
**Status:** ⏳ Not Started
**Objective:** Implement PnL and volume leaderboards with Redis caching

### Tasks

#### 7.1 PnL Leaderboard
- [ ] GET /api/v1/leaderboard/pnl endpoint
- [ ] Query top 100 users by overall_pnl DESC
- [ ] Cache results in Redis (TTL: 5 min)
- [ ] Return: rank, username, PnL, volume
- [ ] Unit tests

#### 7.2 Volume Leaderboard
- [ ] GET /api/v1/leaderboard/volume endpoint
- [ ] Query top 100 users by total_volume DESC
- [ ] Cache results in Redis (TTL: 5 min)
- [ ] Return: rank, username, volume, PnL
- [ ] Unit tests

#### 7.3 Ranking Calculation
- [ ] Create background job (runs every 15 min)
- [ ] Calculate rank_by_pnl for all users
- [ ] Calculate rank_by_volume for all users
- [ ] Update users table
- [ ] Invalidate Redis cache
- [ ] Unit tests

#### 7.4 Redis Sorted Sets
- [ ] Implement ZADD for user scores
- [ ] Implement ZREVRANGE for top 100
- [ ] Implement ZRANK for user position
- [ ] Test sorted set operations
- [ ] Unit tests

#### 7.5 Performance Optimization
- [ ] Index users.overall_pnl
- [ ] Index users.total_volume
- [ ] Test with 10,000+ users
- [ ] Ensure queries complete in <100ms
- [ ] Load testing

### API Endpoints

- `GET /api/v1/leaderboard/pnl` - Top users by PnL
- `GET /api/v1/leaderboard/volume` - Top users by volume

### Success Criteria

- ✅ Leaderboards return top 100 users
- ✅ Rankings update every 15 minutes
- ✅ Redis caching reduces DB load
- ✅ Queries complete in <100ms (p95)
- ✅ Handles 10,000+ users efficiently
- ✅ All endpoints have unit tests

---

## Phase 8: Rewards Module

**Duration:** 2 days
**Status:** ⏳ Not Started
**Objective:** Implement daily credit rewards system

### Tasks

#### 8.1 Daily Reward Claim
- [ ] POST /api/v1/rewards/daily endpoint
- [ ] Check last_daily_reward_at timestamp
- [ ] Validate 24-hour window since last claim
- [ ] Credit 100 credits atomically
- [ ] Update user.last_daily_reward_at
- [ ] Create daily_rewards record
- [ ] Log credit_transaction (type: 'daily_reward')
- [ ] Return success response with next claim time
- [ ] Unit tests

#### 8.2 Reward History
- [ ] GET /api/v1/rewards/history endpoint
- [ ] Return user's reward claim history
- [ ] Support pagination
- [ ] Include timestamps and amounts
- [ ] Unit tests

#### 8.3 Reward Validation
- [ ] Prevent double claims within 24 hours
- [ ] Handle edge cases (midnight boundary)
- [ ] Rate limiting (5 requests/min)
- [ ] Unit tests for edge cases

#### 8.4 Atomic Credit Transactions
- [ ] Wrap reward claim in database transaction
- [ ] Ensure balance update + reward record creation is atomic
- [ ] Test concurrent claims
- [ ] Unit tests

### API Endpoints

- `POST /api/v1/rewards/daily` - Claim daily reward
- `GET /api/v1/rewards/history` - Get reward history

### Success Criteria

- ✅ Users can claim 100 credits daily
- ✅ 24-hour window enforced correctly
- ✅ No double claims possible
- ✅ Credit transactions are atomic
- ✅ All endpoints have unit tests

---

## Phase 9: Testing & Quality Assurance

**Duration:** 3-4 days
**Status:** ⏳ Not Started
**Objective:** Comprehensive testing of all modules

### Tasks

#### 9.1 Unit Tests
- [ ] Achieve 80%+ code coverage
- [ ] Test all service functions
- [ ] Test all validation logic
- [ ] Test edge cases
- [ ] Mock external dependencies

#### 9.2 Integration Tests
- [ ] Test full auth flow (register → login → refresh → logout)
- [ ] Test full betting flow (place → resolve → payout)
- [ ] Test daily reward claiming
- [ ] Test leaderboard updates
- [ ] Test market ingestion pipeline

#### 9.3 Load Testing
- [ ] Simulate 500 concurrent users
- [ ] Test 1,000 bets placed within 1 minute
- [ ] Test market resolution with 10,000 pending bets
- [ ] Measure API response times (p95 < 500ms)
- [ ] Measure database query times

#### 9.4 Edge Case Testing
- [ ] Concurrent bet placement (race conditions)
- [ ] Market expiry during bet placement
- [ ] Insufficient balance edge cases
- [ ] Daily reward claiming at midnight boundary
- [ ] Negative odds or invalid market data

#### 9.5 Security Testing
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test rate limiting effectiveness
- [ ] Test JWT token expiry
- [ ] Test authentication bypass attempts

### Success Criteria

- ✅ 80%+ unit test coverage
- ✅ All integration tests passing
- ✅ API response times p95 < 500ms
- ✅ No critical security vulnerabilities
- ✅ Race conditions handled correctly
- ✅ Load testing passes without errors

---

## Phase 10: Deployment & DevOps

**Duration:** 2-3 days
**Status:** ⏳ Not Started
**Objective:** Deploy to staging and production environments

### Tasks

#### 10.1 Staging Deployment
- [ ] Set up staging server (cloud)
- [ ] Configure PostgreSQL (cloud)
- [ ] Configure Redis (cloud)
- [ ] Run database migrations
- [ ] Deploy backend API
- [ ] Configure environment variables
- [ ] Test all endpoints

#### 10.2 Production Deployment
- [ ] Set up production server (cloud)
- [ ] Configure PostgreSQL with backups
- [ ] Configure Redis with persistence
- [ ] Run database migrations
- [ ] Deploy backend API
- [ ] Configure environment variables
- [ ] Set up monitoring (logs, metrics)
- [ ] Configure alerts

#### 10.3 Database Backups
- [ ] Set up daily PostgreSQL backups
- [ ] Test backup restoration
- [ ] Configure backup retention (30 days)

#### 10.4 Monitoring & Logging
- [ ] Set up centralized logging
- [ ] Configure error tracking (Sentry)
- [ ] Set up performance monitoring
- [ ] Configure uptime monitoring
- [ ] Set up alerts for critical errors

#### 10.5 Rollback Strategy
- [ ] Keep last 3 Docker images
- [ ] Create database migration rollback scripts
- [ ] Document rollback procedures
- [ ] Test rollback process

### Success Criteria

- ✅ Staging environment fully functional
- ✅ Production environment deployed
- ✅ Database backups running daily
- ✅ Monitoring and logging configured
- ✅ Rollback procedures tested

---

## Timeline Summary

| Phase | Duration | Status | Start Date | End Date |
|-------|----------|--------|------------|----------|
| **Phase 1: Data Fetching** | 1 day | ✅ Complete | 2025-11-18 | 2025-11-18 |
| **Phase 2: Infrastructure** | 1-2 days | 🔄 In Progress | TBD | TBD |
| **Phase 3: Authentication** | 3-4 days | ⏳ Not Started | TBD | TBD |
| **Phase 4: User Module** | 2-3 days | ⏳ Not Started | TBD | TBD |
| **Phase 5: Market Module** | 3-4 days | ⏳ Not Started | TBD | TBD |
| **Phase 6: Betting Module** | 4-5 days | ⏳ Not Started | TBD | TBD |
| **Phase 7: Leaderboards** | 2-3 days | ⏳ Not Started | TBD | TBD |
| **Phase 8: Rewards** | 2 days | ⏳ Not Started | TBD | TBD |
| **Phase 9: Testing** | 3-4 days | ⏳ Not Started | TBD | TBD |
| **Phase 10: Deployment** | 2-3 days | ⏳ Not Started | TBD | TBD |
| **Total** | **25-35 days** | **4% Complete** | 2025-11-18 | TBD |

---

## V1 Success Metrics

### Launch Goals (Week 1 after deployment)
- 500 DAU betting users
- 3,000+ total bets placed
- <10s time-to-first-bet (p95)
- >60% D1 retention

### Technical Metrics
- 99.5% uptime
- <500ms API response time (p95)
- <0.5% error rate
- 0 critical bugs in production

---

## V1 Exclusions (DO NOT BUILD)

These features are planned for V2/V3 and should **NOT** be implemented during V1:

- ❌ Wallet integration (WalletConnect, MetaMask, Phantom)
- ❌ USDC/real-money betting
- ❌ In-app credit purchases (Stripe)
- ❌ Creator-driven market creation
- ❌ $THIS token economics
- ❌ KYC/compliance
- ❌ Social features (friends, chat, sharing)
- ❌ Push notifications
- ❌ Email notifications
- ❌ Password reset functionality
- ❌ Admin UI dashboard
- ❌ WebSocket/real-time updates
- ❌ Advanced job queue (BullMQ)

---

## Dependencies & Prerequisites

### Required Tools
- Node.js 20+
- TypeScript 5.9+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose
- Git

### Key Libraries
- Fastify 5.6+ (API framework)
- Prisma 6+ (ORM)
- Zod 3.24+ (Validation)
- bcrypt 5.1+ (Password hashing)
- jsonwebtoken 9.0+ (JWT)
- axios 1.7+ (HTTP client)
- pino 9.6+ (Logging)

---

**Last Updated:** 2025-01-XX
**Current Phase:** Phase 1 ✅ Complete (with full test coverage), Phase 2 🔄 In Progress
**Next Milestone:** Complete Infrastructure Setup (Phase 2)
**Phase 1 Testing:** ✅ 116 tests, 97%+ coverage
