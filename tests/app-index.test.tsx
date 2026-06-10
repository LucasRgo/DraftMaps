import assert from "node:assert/strict";
import test from "node:test";
import React, { useState } from "react";
import { router } from "expo-router";
import TestRenderer from "react-test-renderer";
import { Text } from "react-native";

import Index, { LocationsScreenContent } from "../app/index";
import type { Location } from "../types/location";

(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type TextChild =
    | string
    | number
    | React.ReactElement
    | Iterable<TextChild>
    | null;

function collectText(node: TextChild): string {
    if (typeof node === "string" || typeof node === "number") {
        return String(node);
    }

    if (node == null) {
        return "";
    }

    if (Symbol.iterator in Object(node)) {
        return Array.from(node as Iterable<TextChild>)
            .map((child) => collectText(child))
            .join("");
    }

    const element = node as React.ReactElement<{ children?: TextChild }>;

    return collectText(element.props.children ?? null);
}

function getRenderedText(renderer: TestRenderer.ReactTestRenderer): string[] {
    return renderer.root.findAllByType(Text).map((textNode) => {
        const props = textNode.props as { children?: TextChild };

        return collectText(props.children ?? null);
    });
}

const locations: Location[] = [
    {
        id: "goiania-park-1",
        name: "Bosque dos Buritis",
        category: "park",
        latitude: -16.67,
        longitude: -49.26,
        source: "openstreetmap",
    },
    {
        id: "goiania-library-1",
        name: "Biblioteca Central",
        category: "library",
        latitude: -16.68,
        longitude: -49.25,
        source: "fallback",
    },
];

test("LocationsScreenContent renders loading state", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationsScreenContent
                data={[]}
                error={null}
                isLoading
                reload={() => {}}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "DraftMaps",
        "Places to chill",
        "Loading places...",
    ]);
});

test("LocationsScreenContent renders error state and retries", () => {
    let retries = 0;
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationsScreenContent
                data={[]}
                error="Worker unavailable"
                isLoading={false}
                reload={() => {
                    retries += 1;
                }}
            />,
        );
    });

    const retryButton = renderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel: "Try again",
    });

    TestRenderer.act(() => {
        retryButton.props.onPress();
    });

    assert.equal(retries, 1);
    assert.deepEqual(getRenderedText(renderer), [
        "DraftMaps",
        "Places to chill",
        "Something went wrong",
        "Worker unavailable",
        "Try again",
    ]);
});

test("LocationsScreenContent renders empty state", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationsScreenContent
                data={[]}
                error={null}
                isLoading={false}
                reload={() => {}}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "DraftMaps",
        "Places to chill",
        "No places found",
        "We could not find places to show right now.",
    ]);
});

test("LocationsScreenContent keeps the map focused and hides the list by default", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationsScreenContent
                data={locations}
                error={null}
                isLoading={false}
                reload={() => {}}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "DraftMaps",
        "Places to chill",
        "Goiânia",
        "Show list",
        "Choose a place",
        "Tap a pin or open the list to pick somewhere calm.",
    ]);
});

test("LocationsScreenContent renders the list and updates selected location", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    function StatefulScreen() {
        const [selectedLocationId, setSelectedLocationId] = useState<
            string | null
        >(null);

        return (
            <LocationsScreenContent
                data={locations}
                error={null}
                isLoading={false}
                reload={() => {}}
                selectedLocationId={selectedLocationId}
                onSelectLocation={setSelectedLocationId}
            />
        );
    }

    TestRenderer.act(() => {
        renderer = TestRenderer.create(<StatefulScreen />);
    });

    const firstCard = renderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel: "Show locations list",
    });

    TestRenderer.act(() => {
        firstCard.props.onPress();
    });

    const selectBosqueButton = renderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel: "Select Bosque dos Buritis",
    });

    TestRenderer.act(() => {
        selectBosqueButton.props.onPress();
    });

    assert.deepEqual(getRenderedText(renderer), [
        "DraftMaps",
        "Places to chill",
        "Goiânia",
        "Hide list",
        "Selected place",
        "Bosque dos Buritis",
        "Park",
        "View details",
        "Bosque dos Buritis",
        "Park",
        "Selected",
        "Biblioteca Central",
        "Library",
        "Tap to select",
    ]);
});

test("LocationsScreenContent hides the selected card actions when no location is selected", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationsScreenContent
                data={locations}
                error={null}
                isLoading={false}
                reload={() => {}}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "DraftMaps",
        "Places to chill",
        "Goiânia",
        "Show list",
        "Choose a place",
        "Tap a pin or open the list to pick somewhere calm.",
    ]);
});

test("LocationsScreenContent navigates to the selected location details route", () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    const pushCalls: unknown[] = [];
    const originalPush = router.push;

    router.push = (href: unknown) => {
        pushCalls.push(href);
    };

    function StatefulScreen() {
        const [selectedLocationId, setSelectedLocationId] = useState<
            string | null
        >(null);

        return (
            <LocationsScreenContent
                data={locations}
                error={null}
                isLoading={false}
                reload={() => {}}
                selectedLocationId={selectedLocationId}
                onSelectLocation={setSelectedLocationId}
            />
        );
    }

    try {
        TestRenderer.act(() => {
            renderer = TestRenderer.create(<StatefulScreen />);
        });

        const listToggleButton = renderer.root.findByProps({
            accessibilityRole: "button",
            accessibilityLabel: "Show locations list",
        });

        TestRenderer.act(() => {
            listToggleButton.props.onPress();
        });

        const firstCard = renderer.root.findByProps({
            accessibilityRole: "button",
            accessibilityLabel: "Select Bosque dos Buritis",
        });

        TestRenderer.act(() => {
            firstCard.props.onPress();
        });

        const viewDetailsButton = renderer.root.findByProps({
            accessibilityRole: "button",
            accessibilityLabel: "View details for Bosque dos Buritis",
        });

        TestRenderer.act(() => {
            viewDetailsButton.props.onPress();
        });

        assert.deepEqual(pushCalls, [
            {
                pathname: "/locations/[id]",
                params: { id: "goiania-park-1" },
            },
        ]);
    } finally {
        router.push = originalPush;
    }
});

test("Index exports a mountable default screen component", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(<Index />);
    });

    assert.ok(renderer.root);
});
