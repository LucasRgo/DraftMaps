# DraftMaps

> **Places for you to chill.**
> A cross-platform map app for discovering calm places to read, walk, work, and relax.

[![Expo](https://img.shields.io/badge/Expo-54.0.34-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://typescriptlang.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-Deployed-orange)](https://workers.cloudflare.com)

## Live Demo

* **Production App**: https://draftmaps-worker.lucas-lrg0005.workers.dev
* **Repository**: https://github.com/LucasRgo/DraftMaps

## Overview

DraftMaps is a cross-platform Expo React Native app built for the Draftbit test project.

The app helps users discover calm places in Goiânia, Brazil, such as cafés, libraries, museums, parks, and bookstores. It includes an interactive map, categorized location pins, a selected-location preview card, and a detail screen for each place.

The project is intentionally simple and focused: a reliable map-based MVP that is easy to understand, explain, and modify live.

## Features

* Cross-platform map screen for native and web
* Pins for calm places in Goiânia
* Selected-location card when a pin is tapped
* Location detail screen with available information
* Loading, error, retry, and empty states
* API-backed data from OpenStreetMap via Overpass
* Cloudflare Worker API layer
* Fallback data when Overpass is unavailable

## Tech Stack

### App

* Expo 54
* React Native
* TypeScript
* Expo Router
* NativeWind

### Maps

* `react-native-maps` for iOS and Android
* `react-leaflet` + Leaflet for web
* OpenStreetMap tiles on web

### Backend

* Cloudflare Workers
* OpenStreetMap data via Overpass API

### Development

* ESLint
* TypeScript type checking
* Vitest
* Playwright
* Wrangler

## Architecture

```txt
Expo App
   ↓
Cloudflare Worker API
   ↓
Overpass API / OpenStreetMap
```

The app does not call Overpass directly. It only talks to the Cloudflare Worker.

The Worker is responsible for:

* Querying OpenStreetMap data through Overpass
* Filtering invalid places
* Normalizing OSM nodes, ways, and relations into a clean internal `Location` format
* Returning fallback data if Overpass is slow or unavailable
* Serving the exported web app as static assets

This keeps the app independent from the raw Overpass response shape and makes the demo more reliable.

## Platform-Specific Map Rendering

Native and web map libraries have different APIs, so the map renderer is split by platform:

| Platform      | File                                | Library                   |
| ------------- | ----------------------------------- | ------------------------- |
| iOS / Android | `components/MapRenderer.native.tsx` | `react-native-maps`       |
| Web           | `components/MapRenderer.web.tsx`    | `react-leaflet` + Leaflet |

React Native automatically resolves the correct file based on the target platform.

## Main Decisions

### Fixed city first

The first version focuses on Goiânia, Brazil.

This keeps the MVP focused and avoids unnecessary complexity around free-text city search, geocoding, and uncontrolled map queries.

### Fixed bounding box

The Worker uses a fixed bounding box for Goiânia instead of querying based on arbitrary user movement.

This makes the app more predictable and avoids accidentally sending large or excessive queries to Overpass.

### No requests on zoom or pan

The app loads the city dataset once. Moving or zooming the map does not trigger new API requests.

For a production version, I would add bounding-box queries with debounce, zoom thresholds, result limits, and caching.

### Worker as API layer

The Worker acts as a small backend layer between the app and OpenStreetMap.

This allows the app to consume a clean API, while the Worker handles external data fetching, filtering, fallback behavior, and response shaping.

### Simple state management

The app uses local React state with `useState` and `useEffect`.

For this MVP, Redux, Zustand, and React Query would add more complexity than value.

## API Reference

The Cloudflare Worker exposes two endpoints.

### `GET /api/locations`

Returns the list of normalized locations for Goiânia.

Example response:

```json
{
  "city": "goiania",
  "source": "openstreetmap",
  "locations": [
    {
      "id": "goiania-node-123456",
      "name": "Example Cafe",
      "category": "cafe",
      "latitude": -16.6869,
      "longitude": -49.2648,
      "source": "openstreetmap",
      "address": "Example Street, Goiânia",
      "openingHours": "Mo-Fr 08:00-18:00",
      "phone": "+55 62 0000-0000",
      "websiteUrl": "https://example.com"
    }
  ]
}
```

### `GET /api/locations/:id`

Returns a single normalized location by ID.

Example response:

```json
{
  "id": "goiania-node-123456",
  "name": "Example Cafe",
  "category": "cafe",
  "latitude": -16.6869,
  "longitude": -49.2648,
  "source": "openstreetmap",
  "address": "Example Street, Goiânia"
}
```

Example error response:

```json
{
  "error": "Not found"
}
```

## Location Categories

| Category    | OSM Tag           |
| ----------- | ----------------- |
| `cafe`      | `amenity=cafe`    |
| `library`   | `amenity=library` |
| `museum`    | `tourism=museum`  |
| `park`      | `leisure=park`    |
| `bookstore` | `shop=books`      |

## Project Structure

```txt
DraftMaps/
├── app/
│   ├── _layout.tsx
│   ├── _layout.web.tsx
│   ├── index.tsx
│   └── locations/
│       └── [id].tsx
├── components/
│   ├── MapRenderer.tsx
│   ├── MapRenderer.native.tsx
│   ├── MapRenderer.web.tsx
│   ├── SelectedLocationCard.tsx
│   ├── LocationDetails.tsx
│   ├── Header.tsx
│   ├── Empty.tsx
│   ├── Error.tsx
│   └── Loading.tsx
├── hooks/
│   ├── useLocations.ts
│   └── useLocation.ts
├── services/
│   └── locationsApi.ts
├── types/
│   ├── location.ts
│   └── city.ts
├── utils/
│   ├── fallbackLocations.ts
│   ├── maps.ts
│   └── openMaps.ts
├── worker/
│   ├── index.ts
│   └── fallbackLocations.ts
├── tests/
├── test/
│   └── fixtures/
│       └── locations.ts
├── assets/
├── package.json
├── wrangler.jsonc
└── README.md
```

## Getting Started

### Prerequisites

* Node.js 18+
* npm
* Cloudflare account for deployment

### Install

```bash
git clone https://github.com/LucasRgo/DraftMaps.git
cd DraftMaps
npm install
```

### Run locally

Recommended setup: run the Worker and Expo in separate terminals.

```bash
npm run worker
```

In another terminal:

```bash
npx expo start
```

Run on web:

```bash
npm run web
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

## Useful Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build:web
npm run deploy
```

## Worker

The Worker handles the API and serves the exported web app.

Test the API locally:

```bash
curl http://localhost:8787/api/locations
curl http://localhost:8787/api/locations/goiania-node-123456
```

If Overpass is unavailable, the Worker returns fallback locations so the app can still render a useful demo.

## Deployment

Build the web app and deploy the Worker:

```bash
npm run deploy
```

The Worker serves both:

* `/api/*` API routes
* the static Expo web export

## Future Improvements

* Add predefined city selection
* Add category filtering
* Add a visible places list
* Sync visible pins with the current map bounds
* Add local favorites
* Improve place ranking and deduplication
* Add persistent caching at the Worker layer

## Notes

This project is not meant to be a production-ready map platform.

The goal is to demonstrate a clean, cross-platform MVP with thoughtful technical decisions, a simple API layer, real external data, graceful fallback behavior, and code that can be explained and modified live.
