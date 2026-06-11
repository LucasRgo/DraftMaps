import test from "node:test";
import assert from "node:assert/strict";

import { handleRequest } from "../worker/index";

test("GET /api/locations returns locations array", async () => {
    const request = new Request("http://example.com/api/locations");
    const response = await handleRequest(request);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.city, "goiania");
    assert.ok(Array.isArray(data.locations));
    assert.ok(data.locations.length > 0);

    const location = data.locations[0];
    assert.equal(typeof location.id, "string");
    assert.equal(typeof location.name, "string");
    assert.ok(location.name.length > 0);
    assert.equal(typeof location.latitude, "number");
    assert.equal(typeof location.longitude, "number");
});

test("GET /api/locations/:id returns location", async () => {
    const listRequest = new Request("http://example.com/api/locations");
    const listResponse = await handleRequest(listRequest);
    const listData = await listResponse.json();
    const id = listData.locations[0].id;

    const request = new Request(`http://example.com/api/locations/${encodeURIComponent(id)}`);
    const response = await handleRequest(request);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.id, id);
});

test("GET /api/locations/unknown returns 404", async () => {
    const request = new Request("http://example.com/api/locations/unknown-id");
    const response = await handleRequest(request);
    const data = await response.json();

    assert.equal(response.status, 404);
    assert.equal(data.error, "Not found");
});

test("POST /api/locations returns 405", async () => {
    const request = new Request("http://example.com/api/locations", { method: "POST" });
    const response = await handleRequest(request);
    const data = await response.json();

    assert.equal(response.status, 405);
    assert.equal(data.error, "Method not allowed");
});

test("GET /api/unknown returns 404", async () => {
    const request = new Request("http://example.com/api/unknown");
    const response = await handleRequest(request);
    const data = await response.json();

    assert.equal(response.status, 404);
    assert.equal(data.error, "Not found");
});
