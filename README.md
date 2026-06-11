# DraftMaps

**Places to chill.**

DraftMaps is a cross-platform Expo 54 React Native app built for the Draftbit test project.

Two screens: a map with location pins and a detail screen for each place. Data comes from OpenStreetMap via a Cloudflare Worker.

## Live Demo

- Deployed app: https://draftmaps-worker.lucas-lrg0005.workers.dev
- Repository: https://github.com/lucas-lrg/draftmaps

## Features

- Cross-platform map (native + web)
- Map screen with pins for places in Goiânia
- Selected location card
- Location detail screen
- Data loaded through a Cloudflare Worker API
- Fallback data when Overpass is unavailable

## Tech Stack

- Expo 54
- React Native + TypeScript
- Expo Router + NativeWind
- Cloudflare Workers
- OpenStreetMap via Overpass API
- `react-native-maps` (native) / `react-leaflet` + Leaflet (web)

## Architecture

```
App → Cloudflare Worker API → Overpass API
```

The Worker fetches, normalizes, and filters OSM data. If Overpass fails, it returns fallback data. The app never calls Overpass directly.

Maps are platform-specific: `MapRenderer.native.tsx` and `MapRenderer.web.tsx`.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npx expo start
```

Run on web:

```bash
npx expo start --web
```

Typecheck:

```bash
npm run typecheck
```

Tests:

```bash
npm test
```

## Worker Development

Run the Worker locally:

```bash
npm run cf:dev
```

Deploy to Cloudflare:

```bash
npm run build:web
npm run cf:deploy
```

## Decisions

- **Fixed city first:** Goiânia only. No city search, no geocoding.
- **No requests on zoom/pan:** One bounded fetch. Simple and reliable.
- **Worker as API layer:** App never calls Overpass directly. Fallback keeps the demo working.
- **Simple code:** No Redux, no React Query, no auth, no database. Easy to explain and modify live.

## Future Improvements

- City selection
- Category filters
- Cache by city on the Worker
- Local favorites
