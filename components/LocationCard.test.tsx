import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer from "react-test-renderer";
import { Text } from "react-native";

import type { Location } from "../types/location";
import { LocationCard } from "./LocationCard";

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

const sampleLocation: Location = {
    id: "goiania-park-1",
    name: "Bosque dos Buritis",
    category: "park",
    latitude: -16.67,
    longitude: -49.26,
    source: "openstreetmap",
};

test("LocationCard renders the location name and category", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationCard
                location={sampleLocation}
                isSelected={false}
                onPress={() => {}}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "Bosque dos Buritis",
        "Park",
        "Tap to select",
    ]);
});

test("LocationCard calls onPress when pressed", () => {
    let presses = 0;
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationCard
                location={sampleLocation}
                isSelected={false}
                onPress={() => {
                    presses += 1;
                }}
            />,
        );
    });

    const card = renderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel: "Select Bosque dos Buritis",
    });

    TestRenderer.act(() => {
        card.props.onPress();
    });

    assert.equal(presses, 1);
});

test("LocationCard shows selected state and supports optional fields being absent", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <LocationCard
                location={{
                    ...sampleLocation,
                    category: "bookstore",
                    name: "Livraria Palavrear com um nome bem longo para testar",
                }}
                isSelected
                onPress={() => {}}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "Livraria Palavrear com um nome bem longo para testar",
        "Bookstore",
        "Selected",
    ]);
});
