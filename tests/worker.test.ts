import test from "node:test";
import assert from "node:assert/strict";

import {
    parseElement,
    getCategory,
    getAddress,
    buildOverpassQuery,
    isValidCoordinate,
    hasNameAndCoords,
} from "../worker/index";

test("isValidCoordinate returns true for finite numbers", () => {
    assert.equal(isValidCoordinate(0), true);
    assert.equal(isValidCoordinate(-16.6869), true);
    assert.equal(isValidCoordinate(49.2648), true);
});

test("isValidCoordinate returns false for non-finite numbers", () => {
    assert.equal(isValidCoordinate(NaN), false);
    assert.equal(isValidCoordinate(Infinity), false);
    assert.equal(isValidCoordinate(-Infinity), false);
});

test("hasNameAndCoords returns true for valid location", () => {
    const location = {
        id: "test-1",
        name: "Test",
        category: "cafe" as const,
        latitude: -16.6869,
        longitude: -49.2648,
        source: "openstreetmap" as const,
    };
    assert.equal(hasNameAndCoords(location), true);
});

test("hasNameAndCoords returns false for empty name", () => {
    const location = {
        id: "test-1",
        name: "  ",
        category: "cafe" as const,
        latitude: -16.6869,
        longitude: -49.2648,
        source: "openstreetmap" as const,
    };
    assert.equal(hasNameAndCoords(location), false);
});

test("hasNameAndCoords returns false for invalid coordinates", () => {
    const location = {
        id: "test-1",
        name: "Test",
        category: "cafe" as const,
        latitude: NaN,
        longitude: -49.2648,
        source: "openstreetmap" as const,
    };
    assert.equal(hasNameAndCoords(location), false);
});

test("getCategory returns correct categories", () => {
    assert.equal(getCategory({ amenity: "cafe" }), "cafe");
    assert.equal(getCategory({ amenity: "library" }), "library");
    assert.equal(getCategory({ tourism: "museum" }), "museum");
    assert.equal(getCategory({ leisure: "park" }), "park");
    assert.equal(getCategory({ shop: "books" }), "bookstore");
});

test("getCategory returns null for unknown tags", () => {
    assert.equal(getCategory({ amenity: "restaurant" }), null);
    assert.equal(getCategory({}), null);
    assert.equal(getCategory({ shop: "clothes" }), null);
});

test("getAddress returns street and house number", () => {
    assert.equal(
        getAddress({ "addr:street": "Rua 1", "addr:housenumber": "123" }),
        "Rua 1, 123",
    );
});

test("getAddress returns street only", () => {
    assert.equal(getAddress({ "addr:street": "Rua 1" }), "Rua 1");
});

test("getAddress returns house number only", () => {
    assert.equal(getAddress({ "addr:housenumber": "123" }), "123");
});

test("getAddress returns undefined when no address info", () => {
    assert.equal(getAddress({}), undefined);
});

test("buildOverpassQuery includes correct bbox", () => {
    const query = buildOverpassQuery();
    assert.ok(query.includes("-16.76,-49.36,-16.6,-49.16"));
    assert.ok(query.includes("[out:json]"));
    assert.ok(query.includes("[timeout:8]"));
});

test("buildOverpassQuery includes all amenity types", () => {
    const query = buildOverpassQuery();
    assert.ok(query.includes('"amenity"="cafe"'));
    assert.ok(query.includes('"amenity"="library"'));
    assert.ok(query.includes('"tourism"="museum"'));
    assert.ok(query.includes('"leisure"="park"'));
    assert.ok(query.includes('"shop"="books"'));
});

test("parseElement returns location for valid node", () => {
    const element = {
        type: "node",
        id: 123,
        lat: -16.6869,
        lon: -49.2648,
        tags: {
            name: "Cafe Test",
            amenity: "cafe",
        },
    };
    const result = parseElement(element);
    assert.ok(result);
    assert.equal(result?.id, "goiania-node-123");
    assert.equal(result?.name, "Cafe Test");
    assert.equal(result?.category, "cafe");
    assert.equal(result?.latitude, -16.6869);
    assert.equal(result?.longitude, -49.2648);
    assert.equal(result?.source, "openstreetmap");
});

test("parseElement returns location for valid way with center", () => {
    const element = {
        type: "way",
        id: 456,
        center: {
            lat: -16.6766,
            lon: -49.2643,
        },
        tags: {
            name: "Bosque dos Buritis",
            leisure: "park",
        },
    };
    const result = parseElement(element);
    assert.ok(result);
    assert.equal(result?.id, "goiania-way-456");
    assert.equal(result?.name, "Bosque dos Buritis");
    assert.equal(result?.category, "park");
    assert.equal(result?.latitude, -16.6766);
    assert.equal(result?.longitude, -49.2643);
});

test("parseElement returns location with optional fields", () => {
    const element = {
        type: "node",
        id: 789,
        lat: -16.68,
        lon: -49.25,
        tags: {
            name: "Biblioteca",
            amenity: "library",
            "addr:street": "Rua da Cultura",
            "addr:housenumber": "42",
            opening_hours: "Mo-Fr 09:00-18:00",
            phone: "+55 62 3333-4444",
            website: "https://biblioteca.example.com",
        },
    };
    const result = parseElement(element);
    assert.ok(result);
    assert.equal(result?.address, "Rua da Cultura, 42");
    assert.equal(result?.openingHours, "Mo-Fr 09:00-18:00");
    assert.equal(result?.phone, "+55 62 3333-4444");
    assert.equal(result?.websiteUrl, "https://biblioteca.example.com");
});

test("parseElement returns null for element without name", () => {
    const element = {
        type: "node",
        id: 123,
        lat: -16.6869,
        lon: -49.2648,
        tags: {
            amenity: "cafe",
        },
    };
    assert.equal(parseElement(element), null);
});

test("parseElement returns null for element without coordinates", () => {
    const element = {
        type: "way",
        id: 456,
        tags: {
            name: "Cafe Test",
            amenity: "cafe",
        },
    };
    assert.equal(parseElement(element), null);
});

test("parseElement returns null for element without valid category", () => {
    const element = {
        type: "node",
        id: 123,
        lat: -16.6869,
        lon: -49.2648,
        tags: {
            name: "Restaurant",
            amenity: "restaurant",
        },
    };
    assert.equal(parseElement(element), null);
});

test("parseElement returns null for element with invalid coordinates", () => {
    const element = {
        type: "node",
        id: 123,
        lat: NaN,
        lon: -49.2648,
        tags: {
            name: "Cafe Test",
            amenity: "cafe",
        },
    };
    assert.equal(parseElement(element), null);
});

test("parseElement parses string coordinates", () => {
    const element = {
        type: "node",
        id: 123,
        lat: "-16.6869",
        lon: "-49.2648",
        tags: {
            name: "Cafe Test",
            amenity: "cafe",
        },
    };
    const result = parseElement(element);
    assert.ok(result);
    assert.equal(result?.latitude, -16.6869);
    assert.equal(result?.longitude, -49.2648);
});

test("parseElement handles string center coordinates", () => {
    const element = {
        type: "way",
        id: 456,
        center: {
            lat: "-16.6766",
            lon: "-49.2643",
        },
        tags: {
            name: "Park",
            leisure: "park",
        },
    };
    const result = parseElement(element);
    assert.ok(result);
    assert.equal(result?.latitude, -16.6766);
    assert.equal(result?.longitude, -49.2643);
});

test("parseElement returns null for non-object input", () => {
    assert.equal(parseElement(null), null);
    assert.equal(parseElement("string"), null);
    assert.equal(parseElement(123), null);
});

test("parseElement returns null for empty tags", () => {
    const element = {
        type: "node",
        id: 123,
        lat: -16.6869,
        lon: -49.2648,
        tags: {},
    };
    assert.equal(parseElement(element), null);
});
