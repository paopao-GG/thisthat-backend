# THISTHAT V2 - Frontend-Backend Integration Guide

## Overview

This document describes the completed integration connecting the THISTHAT frontend to the backend for viewing markets and events fetched from Polymarket.

## Completed Flow

```
Polymarket API → Backend (Clean/Normalize) → MongoDB → Backend API → Frontend Display
```

### Step-by-Step Flow

1. **Fetch from Polymarket**: Backend fetches market data from Polymarket Gamma API
2. **Clean Data**: Backend normalizes Polymarket data format to internal schema
3. **Store to MongoDB**: Cleaned data is stored in MongoDB collections
4. **Fetch from MongoDB**: Frontend requests market data via REST API
5. **Display to Frontend**: React components render market cards with betting interface

---

## Files Created/Modified

### Frontend Files

#### Created:
- **`frontend/src/shared/services/api.ts`** - HTTP client for backend API calls
  - Configurable base URL via environment variables
  - Generic GET, POST, PATCH, DELETE methods
  - Error handling and response parsing
  - Authentication token support (for future use)

- **`frontend/.env`** - Environment configuration
  ```env
  VITE_API_BASE_URL=http://localhost:3001
  ```

#### Modified:
- **`frontend/src/app/pages/BettingPage.tsx`**
  - Replaced mock data with real API calls
  - Added loading, error, and empty states
  - Integrated `marketService.getMarkets()` on component mount
  - Maps backend market format to frontend Market type

- **`frontend/src/features/betting/components/MarketCard.tsx`**
  - Enhanced to display complete market information
  - Added category badge
  - Added market stats (liquidity, odds, expiry date)
  - Formatted odds as percentages
  - Formatted liquidity as currency
  - Color-coded odds (green for YES, red for NO)

### Backend Files

#### Modified:
- **`backend/src/features/fetching/market-data/market-data.services.ts`**
  - Fixed `normalizeMarket()` function to handle JSON-stringified outcomes
  - Added robust parsing for Polymarket's outcomes field
  - Improved error handling for malformed data

---

## API Endpoints Used

### Backend Endpoints

1. **Fetch Markets from Polymarket**
   ```bash
   POST /api/v1/markets/fetch?active=true&limit=20
   ```
   - Fetches markets from Polymarket Gamma API
   - Normalizes and saves to MongoDB
   - Returns count of saved markets

2. **Get Markets from Database**
   ```bash
   GET /api/v1/markets?status=active&limit=50
   ```
   - Retrieves markets from MongoDB
   - Supports filtering by status, category, featured
   - Supports pagination (limit, skip)

3. **Get Market Statistics**
   ```bash
   GET /api/v1/markets/stats
   ```
   - Returns market counts by status and category
   - Useful for dashboard/analytics

4. **Fetch Events from Polymarket**
   ```bash
   POST /api/v1/events/fetch?active=true&limit=20
   ```
   - Similar to markets but for events

5. **Get Events from Database**
   ```bash
   GET /api/v1/events?status=active&limit=50
   ```
   - Retrieves events with filtering

---

## Data Flow Details

### 1. Polymarket → Backend

**Polymarket Market Format** (raw):
```json
{
  "question": "Nuclear weapon detonation in 2025?",
  "condition_id": "0x9fcb...",
  "outcomes": "[\"Yes\", \"No\"]",  // ⚠️ JSON string, not array
  "outcomePrices": "[\"0.0305\", \"0.9695\"]",
  "volume": "2181936.417831",
  "liquidity": "48238.52264",
  "accepting_orders": true,
  "end_date_iso": "2025-12-31"
}
```

**Normalization (Backend):**
```typescript
// Parse JSON-stringified outcomes
const outcomes = JSON.parse(polymarketData.outcomes); // ["Yes", "No"]
const thisOption = outcomes[0]; // "Yes"
const thatOption = outcomes[1]; // "No"
```

### 2. Backend → MongoDB

**Flattened Market Schema**:
```typescript
{
  conditionId: string;
  question: string;
  description?: string;
  thisOption: string;        // "Yes"
  thatOption: string;        // "No"
  thisOdds: number;          // 0.0305 (3.05%)
  thatOdds: number;          // 0.9695 (96.95%)
  volume?: number;
  liquidity?: number;
  category?: string;
  status: 'active' | 'closed' | 'archived';
  endDate?: string;
  source: 'polymarket';
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. MongoDB → Frontend

**Backend API Response**:
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "conditionId": "0x9fcb...",
      "question": "Nuclear weapon detonation in 2025?",
      "thisOption": "Yes",
      "thatOption": "No",
      "thisOdds": 0.0305,
      "thatOdds": 0.9695,
      "liquidity": 48238.52264
    }
  ]
}
```

**Frontend Mapping**:
```typescript
const mappedMarkets: Market[] = response.data.map((backendMarket) => ({
  id: backendMarket.conditionId,
  title: backendMarket.question,
  description: backendMarket.description || '',
  thisOption: backendMarket.thisOption,
  thatOption: backendMarket.thatOption,
  thisOdds: backendMarket.thisOdds,
  thatOdds: backendMarket.thatOdds,
  expiryDate: new Date(backendMarket.endDate || new Date()),
  category: backendMarket.category || 'Uncategorized',
  liquidity: backendMarket.liquidity || 0,
}));
```

---

## Testing the Complete Flow

### 1. Start Backend
```bash
cd backend
npm run dev
# Server starts on http://localhost:3001
```

### 2. Fetch Markets from Polymarket
```bash
curl -X POST "http://localhost:3001/api/v1/markets/fetch?active=true&limit=20"
# Response: {"success":true,"message":"Fetched and saved 20 markets","data":{"saved":20,"errors":0}}
```

### 3. Verify Data in MongoDB
```bash
curl "http://localhost:3001/api/v1/markets?status=active&limit=5"
# Returns array of markets with proper thisOption/thatOption
```

### 4. Start Frontend
```bash
cd frontend
npm run dev
# Server starts on http://localhost:5173
```

### 5. View in Browser
1. Open [http://localhost:5173/play](http://localhost:5173/play)
2. Markets are loaded automatically from backend
3. Swipe up/down to navigate between markets
4. Market cards display:
   - Category badge
   - Market title & description
   - Liquidity (formatted as USD)
   - Odds (as percentages, color-coded)
   - Expiry date

---

## Key Implementation Details

### Frontend API Client

**Location**: `frontend/src/shared/services/api.ts`

```typescript
// Singleton pattern for API client
export const apiClient = new ApiClient(API_BASE_URL);

// Usage in services
const response = await apiClient.get<MarketListResponse>('/api/v1/markets', {
  status: 'active',
  limit: 50,
});
```

### Market Service

**Location**: `frontend/src/shared/services/marketService.ts`

```typescript
// Fetch active markets
const markets = await marketService.getMarkets({
  status: 'active',
  limit: 50,
});

// Trigger Polymarket fetch
await marketService.fetchMarkets({
  active: true,
  limit: 20,
});
```

### React Component Integration

**Location**: `frontend/src/app/pages/BettingPage.tsx`

```typescript
useEffect(() => {
  const fetchMarkets = async () => {
    const response = await marketService.getMarkets({
      status: 'active',
      limit: 50,
    });

    const mappedMarkets = response.data.map(/* ... */);
    setMarkets(mappedMarkets);
  };

  fetchMarkets();
}, []);
```

---

## Known Issues & Solutions

### Issue 1: Outcomes Parsing
**Problem**: Polymarket returns `outcomes` as a JSON string `"[\"Yes\", \"No\"]"` instead of an array.

**Solution**: Added JSON.parse() in normalization:
```typescript
let outcomes: string[] = [];
if (typeof polymarketData.outcomes === 'string') {
  outcomes = JSON.parse(polymarketData.outcomes);
} else if (Array.isArray(polymarketData.outcomes)) {
  outcomes = polymarketData.outcomes;
}
```

### Issue 2: CORS Errors
**Solution**: Backend already configured with `@fastify/cors` plugin allowing all origins in development.

### Issue 3: Missing Environment Variables
**Solution**: Created `frontend/.env` with `VITE_API_BASE_URL=http://localhost:3001`.

---

## Environment Configuration

### Backend (.env)
```env
PORT=3001
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=thisthat_test
POLYMARKET_BASE_URL=https://gamma-api.polymarket.com
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## Next Steps (Not Implemented Yet)

1. **Authentication** - User login/registration
2. **Bet Placement** - Actual betting functionality
3. **Real-time Updates** - WebSocket for live odds
4. **User Profile** - Credits, PnL, leaderboard rank
5. **Leaderboard** - Rankings by volume and PnL
6. **Daily Rewards** - Credit distribution system

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    POLYMARKET GAMMA API                      │
│              https://gamma-api.polymarket.com                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP GET /markets
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Fastify)                        │
│                   http://localhost:3001                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Polymarket Client (lib/polymarket-client.ts)        │  │
│  │  - Fetches markets/events from Gamma API             │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                           │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Market Service (market-data.services.ts)            │  │
│  │  - normalizeMarket() - Parse JSON outcomes           │  │
│  │  - fetchAndSaveMarkets() - Store to MongoDB          │  │
│  │  - getAllMarkets() - Retrieve from MongoDB           │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                           │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MongoDB Collection: markets                         │  │
│  │  - Stores flattened market data                      │  │
│  │  - Indexed on conditionId, status, category          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST API Routes                                     │  │
│  │  POST /api/v1/markets/fetch                          │  │
│  │  GET  /api/v1/markets                                │  │
│  │  GET  /api/v1/markets/stats                          │  │
│  └────────────────┬─────────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    │ HTTP JSON API
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                     │
│                   http://localhost:5173                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Client (shared/services/api.ts)                 │  │
│  │  - Generic HTTP client (GET, POST, PATCH, DELETE)    │  │
│  │  - Error handling & response parsing                 │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                           │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Market Service (shared/services/marketService.ts)   │  │
│  │  - fetchMarkets() - Trigger Polymarket fetch         │  │
│  │  - getMarkets() - Get markets from backend           │  │
│  │  - getStats() - Get market statistics                │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                           │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BettingPage Component (app/pages/BettingPage.tsx)   │  │
│  │  - useEffect() fetches markets on mount              │  │
│  │  - Maps backend format to frontend Market type       │  │
│  │  - Renders MarketCard + BettingControls              │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                           │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MarketCard Component                                │  │
│  │  - Displays category, title, description             │  │
│  │  - Shows liquidity, odds (%), expiry date            │  │
│  │  - Swipe navigation support                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BettingControls Component                           │  │
│  │  - THIS/THAT selection buttons                       │  │
│  │  - Bet amount input with slider                      │  │
│  │  - Potential payout calculation                      │  │
│  │  - TODO: Connect to betting API                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

✅ Backend fetches markets from Polymarket Gamma API
✅ Backend normalizes Polymarket data (handles JSON-stringified outcomes)
✅ Backend stores markets to MongoDB
✅ Backend exposes REST API for markets
✅ Frontend API client created
✅ Frontend marketService connects to backend
✅ Frontend eventService connects to backend
✅ BettingPage fetches real data on mount
✅ BettingPage displays loading/error states
✅ MarketCard displays complete market information
✅ Markets display with proper THIS/THAT options
✅ Odds displayed as percentages
✅ Liquidity formatted as currency
✅ Category badges shown
✅ Swipe navigation works

---

## Developer Notes

### Running the Application

1. **Start MongoDB**:
   ```bash
   # Make sure MongoDB is running on localhost:27017
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Fetch Markets** (one-time or periodic):
   ```bash
   curl -X POST "http://localhost:3001/api/v1/markets/fetch?active=true&limit=50"
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Betting Page: http://localhost:5173/play

### Data Refresh

Markets are **not** automatically refreshed. To update market data:

```bash
# Fetch latest markets from Polymarket
curl -X POST "http://localhost:3001/api/v1/markets/fetch?active=true&limit=100"

# Frontend will fetch updated data on page refresh
```

### Debugging

- **Backend logs**: Check terminal running `npm run dev` in backend/
- **Frontend errors**: Open browser DevTools Console
- **API calls**: Network tab in DevTools shows all HTTP requests
- **Database**: Use MongoDB Compass to inspect `thisthat_test.markets` collection

---

**Date**: 2025-11-20
**Version**: V1 - Markets Viewing Only
**Status**: ✅ Complete and Working
