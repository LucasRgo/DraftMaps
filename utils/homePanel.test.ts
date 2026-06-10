import assert from "node:assert/strict";
import test from "node:test";

async function importHomePanel() {
    // @ts-ignore Node test runner needs the explicit TypeScript extension here.
    return import("./homePanel.ts");
}

test("getLocationsPanelSummary describes the selected place when available", async () => {
    const { getLocationsPanelSummary } = await importHomePanel();

    assert.equal(
        getLocationsPanelSummary(8, "Bosque dos Buritis"),
        "8 spots mapped. Selected: Bosque dos Buritis.",
    );
});

test("getLocationsPanelSummary falls back to total count when nothing is selected", async () => {
    const { getLocationsPanelSummary } = await importHomePanel();

    assert.equal(getLocationsPanelSummary(1, null), "1 spot mapped. Browse the calmest picks.");
    assert.equal(getLocationsPanelSummary(12, ""), "12 spots mapped. Browse the calmest picks.");
});

test("getLocationsPanelToggleLabel reflects the current open state", async () => {
    const { getLocationsPanelToggleLabel } = await importHomePanel();

    assert.equal(getLocationsPanelToggleLabel(true), "Hide list");
    assert.equal(getLocationsPanelToggleLabel(false), "Show list");
});
