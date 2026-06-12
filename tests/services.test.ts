import test from "node:test";
import assert from "node:assert/strict";

import { fallbackLocations } from "../utils/fallbackLocations";
import { fetchLocations, fetchLocationById } from "../services/locationsApi";

const originalFetch = global.fetch;

function mockFetch(response: Response) {
    global.fetch = async () => response;
}

function restoreFetch() {
    global.fetch = originalFetch;
}

test("fetchLocations returns locations array", async () => {
    mockFetch(
        new Response(
            JSON.stringify({
                locations: [
                    {
                        id: "goiania-cafe-1",
                        name: "Cafe Test",
                        category: "cafe",
                        latitude: -16.6869,
                        longitude: -49.2648,
                        source: "openstreetmap",
                    },
                ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
        ),
    );

    try {
        const locations = await fetchLocations();
        assert.equal(locations.length, 1);
        assert.equal(locations[0].id, "goiania-cafe-1");
        assert.equal(locations[0].name, "Cafe Test");
    } finally {
        restoreFetch();
    }
});

test("fetchLocations returns fallback on non-ok response", async () => {
    mockFetch(new Response("Server error", { status: 500 }));

    try {
        const locations = await fetchLocations();
        assert.deepEqual(locations, fallbackLocations);
    } finally {
        restoreFetch();
    }
});

test("fetchLocations returns fallback on invalid response without locations array", async () => {
    mockFetch(
        new Response(JSON.stringify({ error: "bad" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        }),
    );

    try {
        const locations = await fetchLocations();
        assert.deepEqual(locations, fallbackLocations);
    } finally {
        restoreFetch();
    }
});

test("fetchLocations returns fallback on null response", async () => {
    mockFetch(
        new Response(JSON.stringify(null), {
            status: 200,
            headers: { "content-type": "application/json" },
        }),
    );

    try {
        const locations = await fetchLocations();
        assert.deepEqual(locations, fallbackLocations);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById returns location", async () => {
    mockFetch(
        new Response(
            JSON.stringify({
                id: "goiania-park-1",
                name: "Bosque dos Buritis",
                category: "park",
                latitude: -16.6766,
                longitude: -49.2643,
                source: "openstreetmap",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
        ),
    );

    try {
        const location = await fetchLocationById("goiania-park-1");
        assert.equal(location.id, "goiania-park-1");
        assert.equal(location.name, "Bosque dos Buritis");
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById throws for empty id", async () => {
    await assert.rejects(fetchLocationById("  "), /Location id is required/);
});

test("fetchLocationById throws for empty string id", async () => {
    await assert.rejects(fetchLocationById(""), /Location id is required/);
});

test("fetchLocationById throws on 404", async () => {
    mockFetch(
        new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
        }),
    );

    try {
        await assert.rejects(fetchLocationById("unknown-id"), /Location not found/);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById throws on 500 when id does not exist in fallback", async () => {
    mockFetch(new Response("Server error", { status: 500 }));

    try {
        await assert.rejects(fetchLocationById("some-id"), /Failed to load location/);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById returns fallback on network error when id exists", async () => {
    const fallback = fallbackLocations[0];
    global.fetch = async () => {
        throw new Error("Network error");
    };

    try {
        const location = await fetchLocationById(fallback.id);
        assert.equal(location.id, fallback.id);
        assert.equal(location.name, fallback.name);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById throws on network error when id does not exist", async () => {
    global.fetch = async () => {
        throw new Error("Network error");
    };

    try {
        await assert.rejects(fetchLocationById("unknown-id"), /Failed to load location/);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById encodes id in URL", async () => {
    let requestedUrl = "";
    global.fetch = async (url: RequestInfo | URL) => {
        requestedUrl = url.toString();
        return new Response(
            JSON.stringify({
                id: "goiania-park-1",
                name: "Test",
                category: "park",
                latitude: -16.6766,
                longitude: -49.2643,
                source: "openstreetmap",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
        );
    };

    try {
        await fetchLocationById("goiania/park/1");
        assert.ok(requestedUrl.includes("goiania%2Fpark%2F1"));
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById returns fallback on 404 when id exists", async () => {
    const fallback = fallbackLocations[0];
    mockFetch(
        new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
        }),
    );

    try {
        const location = await fetchLocationById(fallback.id);
        assert.equal(location.id, fallback.id);
        assert.equal(location.name, fallback.name);
        assert.equal(location.latitude, fallback.latitude);
        assert.equal(location.longitude, fallback.longitude);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById returns fallback on 500 when id exists", async () => {
    const fallback = fallbackLocations[1];
    mockFetch(new Response("Server error", { status: 500 }));

    try {
        const location = await fetchLocationById(fallback.id);
        assert.equal(location.id, fallback.id);
        assert.equal(location.name, fallback.name);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById throws on 404 when id does not exist in fallback", async () => {
    mockFetch(
        new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
        }),
    );

    try {
        await assert.rejects(fetchLocationById("unknown-id"), /Location not found/);
    } finally {
        restoreFetch();
    }
});

test("fetchLocationById throws on 500 when id does not exist in fallback", async () => {
    mockFetch(new Response("Server error", { status: 500 }));

    try {
        await assert.rejects(fetchLocationById("unknown-id"), /Failed to load location/);
    } finally {
        restoreFetch();
    }
});
