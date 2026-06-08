# DraftMaps

**Places to chill.**

DraftMaps is a cross-platform Expo 54 React Native app built for the Draftbit test project.

The app helps users discover calm places in Goiânia, Brazil, such as parks, cafés, libraries, museums, and bookstores. It includes a map screen with location pins and a detail screen for each place.

## Live Demo

* Deployed app: `TODO`
* Repository: `TODO`

## Features

* Cross-platform map experience for native and web
* Map screen with pins for places in Goiânia
* Collapsible location list
* Selected location card
* Location detail screen
* Data loaded through a Cloudflare Worker API
* Fallback data when the external API is unavailable

## Tech Stack

* Expo 54
* React Native
* TypeScript
* Expo Router
* NativeWind
* Cloudflare Workers
* OpenStreetMap via Overpass API
* `react-native-maps` for native maps
* `react-leaflet` and Leaflet for web maps

## Architecture

The app does not call Overpass directly.

```txt
App -> Cloudflare Worker API -> Overpass API
```

The Worker is responsible for:

* Fetching OpenStreetMap data
* Normalizing OSM nodes/ways into a clean `Location` format
* Removing items without valid coordinates
* Returning fallback data if Overpass is unavailable

The map implementation is platform-specific:

```txt
MapRenderer.native.tsx -> react-native-maps
MapRenderer.web.tsx    -> react-leaflet + Leaflet/OpenStreetMap
```

This keeps most of the app shared while using the correct map library for each platform.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo app:

```bash
npx expo start
```

Run on web:

```bash
npx expo start --web
```

Run typecheck:

```bash
npm run typecheck
```

## Cloudflare Deploy

Build the web app:

```bash
npm run build:web
```

Deploy to Cloudflare:

```bash
npm run deploy
```

## Main Decisions

### Fixed city first

The first version focuses on Goiânia only. This keeps the MVP reliable and avoids unnecessary complexity around free-text city search, geocoding, and uncontrolled map queries.

### No requests on zoom or pan

The app fetches a bounded city dataset once. Moving or zooming the map does not trigger new API requests.

For a production version, I would add bounding-box queries with debounce, zoom thresholds, result limits, and caching.

### Worker as API layer

The Worker keeps the React Native app independent from the raw Overpass response shape. This makes the app easier to maintain and allows fallback data for a more reliable demo.

## Future Improvements

* Add predefined city selection
* Add category filters
* Sync the list with the visible map area
* Add local favorites
* Add cache by city on the Worker
* Improve place ranking and deduplication

## Project Goal

The goal of this project is not to build a production-ready map platform. The goal is to deliver a reliable, understandable, cross-platform MVP that is easy to explain, modify, and extend live.
