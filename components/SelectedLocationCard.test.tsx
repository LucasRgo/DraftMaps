import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer from "react-test-renderer";
import { Text } from "react-native";

import type { Location } from "../types/location";
import { SelectedLocationCard } from "./SelectedLocationCard";

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
    id: "goiania-library-1",
    name: "Biblioteca Central",
    category: "library",
    latitude: -16.68,
    longitude: -49.25,
    source: "fallback",
};

test("SelectedLocationCard renders nothing when no location is selected", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <SelectedLocationCard location={null} onViewDetails={() => {}} />,
        );
    });

    assert.equal(renderer.toJSON(), null);
});

test("SelectedLocationCard renders name, category, and view details action", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <SelectedLocationCard
                location={sampleLocation}
                onViewDetails={() => {}}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "Selected place",
        "Biblioteca Central",
        "Library",
        "View details",
    ]);
});

test("SelectedLocationCard calls onViewDetails for the current location", () => {
    let selectedId = "";
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <SelectedLocationCard
                location={{
                    ...sampleLocation,
                    name: "Livraria Palavrear com um nome bem longo para testar",
                    category: "bookstore",
                }}
                onViewDetails={(locationId) => {
                    selectedId = locationId;
                }}
            />,
        );
    });

    const button = renderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel:
            "View details for Livraria Palavrear com um nome bem longo para testar",
    });

    TestRenderer.act(() => {
        button.props.onPress();
    });

    assert.equal(selectedId, "goiania-library-1");
    assert.deepEqual(getRenderedText(renderer), [
        "Selected place",
        "Livraria Palavrear com um nome bem longo para testar",
        "Bookstore",
        "View details",
    ]);
});
