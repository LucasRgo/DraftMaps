# DraftMaps

> **Places to chill.**
> A cross-platform map application helping users discover calm places to read, walk, work, and relax.

[![Expo](https://img.shields.io/badge/Expo-54.0.34-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://typescriptlang.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-Latest-orange)](https://workers.cloudflare.com)

## Live Demo

- **Production App**: https://draftmaps-worker.lucas-lrg0005.workers.dev
- **Repository**: https://github.com/LucasRgo/DraftMaps

## Overview

DraftMaps is a cross-platform mobile and web application built with **Expo 54** and **React Native** that helps users discover peaceful locations in Goiânia, Brazil. The app features an interactive map with categorized pins, a collapsible location list, and a detailed view for each place.

### Key Features

- **Cross-Platform Maps**: Native maps via `react-native-maps` on iOS/Android, web maps via `react-leaflet` on web
- **Interactive Map Screen**: Pan and zoom exploration with categorized pins (cafes, libraries, museums, parks, bookstores)
- **Collapsible Location List**: Browse all locations without interacting with the map
- **Selected Location Card**: Tap any pin to see a quick preview with category and name
- **Location Detail Screen**: Full details including address, opening hours, phone, and website
- **Offline-Ready Fallback**: Mock data ensures the app works even when the Overpass API is unavailable
- **Worker API Layer**: All external data fetching handled by a Cloudflare Worker with caching

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│   Expo App      │──────▶  Cloudflare      │──────▶  Overpass API   │
│  (React Native) │      │  Worker          │      │  (OpenStreetMap)│
│                 │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Fallback Data   │
                         │  (Local Cache)   │
                         └──────────────────┘
```

### Data Flow

1. **App** requests locations from the **Cloudflare Worker API**
2. **Worker** fetches from **Overpass API** (OpenStreetMap) with a 1-minute in-memory cache
3. **Worker** normalizes OSM nodes/ways/relations into a clean `Location` format
4. If Overpass fails, **Worker** returns **fallback mock data** with real Goiânia locations
5. **App** renders locations on platform-specific maps

### Platform-Specific Map Rendering

| Platform | File | Library | Provider |
|----------|------|---------|----------|
| Native | `components/MapRenderer.native.tsx` | `react-native-maps` | Apple Maps / Google Maps |
| Web | `components/MapRenderer.web.tsx` | `react-leaflet` + Leaflet | OpenStreetMap tiles |

## Tech Stack

### Frontend
- **Expo 54** — Cross-platform development framework
- **React Native 0.81.5** — Native UI framework
- **TypeScript 5.9.2** — Type-safe development
- **Expo Router 6.0** — File-based routing
- **NativeWind 4.2** — Tailwind CSS for React Native
- **react-native-maps** — Native map rendering
- **react-leaflet** — Web map rendering

### Backend
- **Cloudflare Workers** — Edge computing platform
- **Overpass API** — OpenStreetMap data query service

### Development
- **Vitest** — Unit testing
- **Playwright** — E2E testing
- **ESLint** — Code linting
- **Wrangler** — Cloudflare Workers CLI

## Project Structure

```
DraftMaps/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout with SafeAreaProvider
│   ├── index.tsx                 # Main map screen
│   └── locations/
│       └── [id].tsx              # Location detail screen
├── components/                   # Reusable components
│   ├── MapRenderer.native.tsx    # Native map (iOS/Android)
│   ├── MapRenderer.web.tsx       # Web map (Leaflet)
│   ├── LocationList.tsx          # Collapsible location list
│   ├── LocationCard.tsx          # Selected location card
│   ├── LocationDetail.tsx        # Detail screen content
│   └── Collapsible.tsx           # Reusable collapsible wrapper
├── hooks/                        # Custom React hooks
│   ├── useLocations.ts           # Fetch locations from API
│   └── useLocationById.ts        # Fetch single location by ID
├── services/                     # API service layer
│   └── api.ts                    # API client and fetch helpers
├── types/                        # TypeScript definitions
│   ├── location.ts               # Location type definitions
│   └── city.ts                   # City configuration (Goiânia)
├── utils/                        # Utility functions
│   ├── normalize.ts              # OSM data normalization
│   └── format.ts                 # Formatting helpers
├── worker/                       # Cloudflare Worker
│   ├── index.ts                  # Worker entry point (API routes)
│   └── fallbackLocations.ts      # Mock data for offline fallback
├── tests/                        # Test suites
│   ├── api.test.ts               # API client tests
│   ├── maps.test.ts              # Map component tests
│   ├── services.test.ts          # Service layer tests
│   └── worker.test.ts            # Worker logic tests
├── assets/                       # Static assets
├── package.json                  # Dependencies and scripts
├── wrangler.jsonc                # Cloudflare Worker configuration
└── README.md                     # This file
```

## API Reference

The Cloudflare Worker exposes two REST endpoints:

### GET /api/locations

Returns a list of locations for the configured city.

**Response:**
```json
{
  "city": "goiania",
  "source": "openstreetmap",
  "locations": [
    {
      "id": "goiania-node-123456",
      "name": "Café Literário",
      "category": "cafe",
      "latitude": -16.6869,
      "longitude": -49.2648,
      "source": "openstreetmap",
      "address": "Rua 123, 456",
      "openingHours": "Mo-Fr 08:00-18:00",
      "phone": "+55 62 1234-5678",
      "websiteUrl": "https://example.com"
    }
  ]
}
```

### GET /api/locations/:id

Returns a single location by ID.

**Response:**
```json
{
  "id": "goiania-node-123456",
  "name": "Café Literário",
  "category": "cafe",
  "latitude": -16.6869,
  "longitude": -49.2648,
  "source": "openstreetmap",
  "address": "Rua 123, 456"
}
```

**Error Response (404):**
```json
{ "error": "Not found" }
```

### Data Sources

- **OpenStreetMap** via Overpass API (primary)
- **Fallback mock data** (when Overpass is unavailable)

### Categories

| Category | OSM Tag | Description |
|----------|---------|-------------|
| `cafe` | `amenity=cafe` | Coffee shops and cafes |
| `library` | `amenity=library` | Public libraries |
| `museum` | `tourism=museum` | Museums and galleries |
| `park` | `leisure=park` | Parks and green spaces |
| `bookstore` | `shop=books` | Bookstores |

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+ or **yarn**
- **Cloudflare account** (for Worker deployment)
- **Wrangler CLI** (installed automatically via `npm install`)

### Installation

```bash
# Clone the repository
git clone https://github.com/lucas-lrg/draftmaps.git
cd draftmaps

# Install dependencies
npm install
```

### Environment Setup

The app uses a Cloudflare Worker as the API backend. The API endpoint is configured in `services/api.ts`.

**For local development with the Worker:**

1. The Worker will run on `http://localhost:8787` when started with `wrangler dev`
2. Update the API base URL in your app configuration to point to the local Worker

### Running the App

#### Expo Development Server

```bash
# Start the Expo development server
npm start
# or
npx expo start

# Start for specific platform
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

#### Type Checking

```bash
npm run typecheck
```

#### Linting

```bash
npm run lint
```

### Testing

```bash
# Run all tests (unit + e2e)
npm test

# Run unit tests only
npm run test:unit

# Run e2e tests only
npm run test:e2e
```

## Worker Development

The Cloudflare Worker handles all external data fetching, normalization, and caching. It serves as the API layer between the app and OpenStreetMap.

### Worker Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run cf:dev` | Build web app and start local Worker with hot-reload | **Primary development** - Edit API code and test locally |
| `npm run cf:remote` | Build web app and start local Worker with remote resources | Test with Cloudflare remote services |
| `npm run cf:deploy` | Build web app and deploy to Cloudflare | **Production deployment** |

### Local Worker Development Workflow

**Step 1: Start the Worker locally**

```bash
# Terminal 1
npm run cf:dev
```

This will:
1. Build the web app (`expo export --platform web`)
2. Start Wrangler dev server on `http://localhost:8787`
3. Enable hot-reload for Worker code changes

**Step 2: Configure the app to use the local Worker**

Ensure your app is pointing to the local Worker endpoint:

```typescript
// services/api.ts
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8787'  // Local Worker
  : 'https://your-worker.your-subdomain.workers.dev';  // Production
```

**Step 3: Edit the Worker**

Modify files in `worker/`:
- `worker/index.ts` — API routes, caching, Overpass fetching
- `worker/fallbackLocations.ts` — Mock data for offline mode

Changes are automatically reloaded by Wrangler.

**Step 4: Test the API**

```bash
# Test locations endpoint
curl http://localhost:8787/api/locations

# Test single location
curl http://localhost:8787/api/locations/goiania-node-123456
```

### Fallback Behavior

When the Worker is not running locally:

1. The app will attempt to connect to the local Worker
2. If the connection fails, the app falls back to **mock data** (defined in `worker/fallbackLocations.ts`)
3. This ensures the app always works, even without internet or the Worker running

**To verify fallback is working:**
1. Stop the Worker (`Ctrl+C` in the Worker terminal)
2. Reload the app
3. You should see fallback locations instead of live Overpass data

### Worker Architecture

```
Incoming Request
      │
      ▼
┌─────────────┐
│  API Route  │
│  (/api/*)   │
└─────────────┘
      │
      ▼
┌─────────────┐      ┌─────────────┐
│  Cache Hit? │──No─▶│ Overpass    │
│  (1 min)    │      │  Fetch      │
└─────────────┘      └─────────────┘
      │Yes                 │
      ▼                    ▼
┌─────────────┐     ┌─────────────┐
│  Return     │     │  Normalize  │
│  Cached     │     │  OSM Data   │
│  Data       │     └─────────────┘
└─────────────┘           │
                          ▼
                    ┌─────────────┐
                    │  Store in   │
                    │  Cache      │
                    └─────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
        ┌─────────────┐         ┌─────────────┐
        │  Success    │         │  Failure    │
        │  Return OSM │         │  Return     │
        │  Data       │         │  Fallback   │
        └─────────────┘         └─────────────┘
```

### Worker Configuration

The Worker is configured via `wrangler.jsonc`:

```json
{
  "name": "draftmaps-worker",
  "main": "worker/index.ts",
  "compatibility_date": "2026-06-09",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }
}
```

Key settings:
- **name**: Worker name on Cloudflare
- **main**: Entry point file
- **assets**: Static web app served from `dist/` directory
- **run_worker_first**: API routes are handled by the Worker before static assets

### Caching Strategy

The Worker uses a simple in-memory cache with a 1-minute TTL:

```typescript
const CACHE_TTL_MS = 60_000; // 1 minute
```

This balances fresh data with reduced Overpass API load. The cache is per-request in the Worker (not persistent across requests in production).

## Deployment

### Deploy the Worker

```bash
npm run cf:deploy
```

This will:
1. Build the web app for production
2. Deploy the Worker to Cloudflare
3. Serve both the API and the static web app from the same Worker

### Deploy the Mobile App

For mobile deployment, use Expo's build services:

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Or use EAS (Expo Application Services)
npx eas build
```

## Testing Strategy

### Unit Tests

Unit tests cover:
- **API client** (`tests/api.test.ts`) — HTTP requests, error handling, response parsing
- **Map helpers** (`tests/maps.test.ts`) — Coordinate validation, map bounds
- **Services** (`tests/services.test.ts`) — Data fetching, caching, state management
- **Worker logic** (`tests/worker.test.ts`) — Overpass parsing, normalization, filtering

### E2E Tests

Playwright tests cover:
- Map rendering and interaction
- Location list navigation
- Detail screen routing
- Fallback data display

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e
```

## Future Improvements

- **City Selection**: Allow users to switch between cities
- **Category Filters**: Filter locations by category (cafe, park, etc.)
- **Persistent Cache**: Cache location data by city on the Worker
- **Local Favorites**: Save favorite locations locally
- **Search**: Search locations by name or category
- **Directions**: Integration with mapping services for directions
- **User Reviews**: Add ratings and reviews
