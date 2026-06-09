import { GOIANIA } from "../types/city";
import type { OverpassElement } from "./overpassParser";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_TIMEOUT_MS = 8000;

type OverpassApiResponse = {
  elements?: OverpassElement[];
};

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId);
    },
  };
}

export function buildGoianiaOverpassQuery(): string {
  const [south, west, north, east] = GOIANIA.bbox;
  const bbox = `${south},${west},${north},${east}`;

  return `
[out:json][timeout:8];
(
  node["amenity"="cafe"](${bbox});
  way["amenity"="cafe"](${bbox});
  relation["amenity"="cafe"](${bbox});
  node["amenity"="library"](${bbox});
  way["amenity"="library"](${bbox});
  relation["amenity"="library"](${bbox});
  node["tourism"="museum"](${bbox});
  way["tourism"="museum"](${bbox});
  relation["tourism"="museum"](${bbox});
  node["leisure"="park"](${bbox});
  way["leisure"="park"](${bbox});
  relation["leisure"="park"](${bbox});
  node["shop"="books"](${bbox});
  way["shop"="books"](${bbox});
  relation["shop"="books"](${bbox});
);
out center tags;
`.trim();
}

export async function fetchGoianiaOverpassElements(): Promise<OverpassElement[]> {
  const { signal, cleanup } = createTimeoutSignal(OVERPASS_TIMEOUT_MS);

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
      body: buildGoianiaOverpassQuery(),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as OverpassApiResponse;

    if (!Array.isArray(payload.elements)) {
      throw new Error("Overpass response did not include an elements array");
    }

    return payload.elements;
  } finally {
    cleanup();
  }
}
