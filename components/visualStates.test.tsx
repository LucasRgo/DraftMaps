import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer from "react-test-renderer";
import { Text } from "react-native";

import { AppButton } from "./AppButton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type TextChild = string | number | React.ReactElement | Iterable<TextChild> | null;

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

test("LoadingState renders loading feedback", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(<LoadingState />);
    });

    assert.deepEqual(getRenderedText(renderer), ["Loading places..."]);
});

test("ErrorState renders message and calls retry when pressed", () => {
    let retryCalls = 0;
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <ErrorState
                message="Worker unavailable"
                onRetry={() => {
                    retryCalls += 1;
                }}
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "Something went wrong",
        "Worker unavailable",
        "Try again",
    ]);

    const retryButton = renderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel: "Try again",
    });

    TestRenderer.act(() => {
        retryButton.props.onPress();
    });

    assert.equal(retryCalls, 1);
});

test("ErrorState hides retry button without callback and falls back to a safe message", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(<ErrorState message="" />);
    });

    assert.deepEqual(getRenderedText(renderer), [
        "Something went wrong",
        "Unable to load places right now.",
    ]);
    assert.equal(
        renderer.root.findAllByProps({ accessibilityRole: "button" }).length,
        0,
    );
});

test("EmptyState renders title and message", () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <EmptyState
                title="No calm places yet"
                message="Try again in a moment."
            />,
        );
    });

    assert.deepEqual(getRenderedText(renderer), [
        "No calm places yet",
        "Try again in a moment.",
    ]);
});

test("AppButton calls onPress and ignores presses when disabled", () => {
    let enabledCalls = 0;
    let disabledCalls = 0;
    let enabledRenderer!: TestRenderer.ReactTestRenderer;
    let disabledRenderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        enabledRenderer = TestRenderer.create(
            <AppButton
                title="Open details"
                onPress={() => {
                    enabledCalls += 1;
                }}
            />,
        );
        disabledRenderer = TestRenderer.create(
            <AppButton
                title="Retry"
                disabled
                onPress={() => {
                    disabledCalls += 1;
                }}
            />,
        );
    });

    const enabledButton = enabledRenderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel: "Open details",
    });
    const disabledButton = disabledRenderer.root.findByProps({
        accessibilityRole: "button",
        accessibilityLabel: "Retry",
    });

    TestRenderer.act(() => {
        enabledButton.props.onPress();
        disabledButton.props.onPress?.();
    });

    assert.equal(enabledCalls, 1);
    assert.equal(disabledCalls, 0);
});
