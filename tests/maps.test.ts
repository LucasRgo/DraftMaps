import test from "node:test";
import assert from "node:assert/strict";

import { buildMapsDirectionsUrl } from "../utils/maps";

test("buildMapsDirectionsUrl returns correct Google Maps URL for negative coordinates", () => {
    const url = buildMapsDirectionsUrl(-16.6869, -49.2648);
    assert.equal(url, "https://www.google.com/maps/dir/?api=1&destination=-16.6869,-49.2648");
});

test("buildMapsDirectionsUrl preserves positive and negative coordinates without rounding", () => {
    const url = buildMapsDirectionsUrl(40.7128, -74.006);
    assert.equal(url, "https://www.google.com/maps/dir/?api=1&destination=40.7128,-74.006");
});

test("buildMapsDirectionsUrl preserves many decimal places", () => {
    const url = buildMapsDirectionsUrl(0.123456789, -0.987654321);
    assert.equal(url, "https://www.google.com/maps/dir/?api=1&destination=0.123456789,-0.987654321");
});
