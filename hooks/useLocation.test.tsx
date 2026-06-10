import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer from "react-test-renderer";

import { useLocation } from "./useLocation";

(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type HookState = ReturnType<typeof useLocation>;

type Deferred<T> = {
    promise: Promise<T>;
    reject: (reason?: unknown) => void;
    resolve: (value: T | PromiseLike<T>) => void;
};

function createDeferred<T>(): Deferred<T> {
    let resolve!: Deferred<T>["resolve"];
    let reject!: Deferred<T>["reject"];

    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });

    return {
        promise,
        reject,
        resolve,
    };
}

function createJsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
        },
    });
}

async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
}

function renderHook(locationId: string) {
    let latestState: HookState | undefined;

    function Probe({ id }: { id: string }) {
        latestState = useLocation(id);
        return null;
    }

    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(<Probe id={locationId} />);
    });

    return {
        getState() {
            assert.ok(latestState);
            return latestState;
        },
        unmount() {
            TestRenderer.act(() => {
                renderer.unmount();
            });
        },
    };
}

function setEnv(env: Record<string, string | undefined>) {
    const originalProcess = globalThis.process;
    globalThis.process = {
        env,
    } as typeof process;

    return () => {
        globalThis.process = originalProcess;
    };
}

test("useLocation starts loading on mount and returns the loaded location", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    const request = createDeferred<Response>();
    let requestedUrl = "";

    globalThis.fetch = async (input) => {
        requestedUrl = String(input);
        return request.promise;
    };

    try {
        const hook = renderHook("goiania-node-1");

        assert.equal(hook.getState().isLoading, true);
        assert.equal(hook.getState().error, null);
        assert.equal(hook.getState().data, null);

        await TestRenderer.act(async () => {
            request.resolve(
                createJsonResponse({
                    id: "goiania-node-1",
                    name: "Bosque dos Buritis",
                    category: "park",
                    latitude: -16.67,
                    longitude: -49.26,
                    source: "openstreetmap",
                }),
            );
            await flushMicrotasks();
        });

        assert.equal(
            requestedUrl,
            "https://draftmaps.example/api/locations/goiania-node-1",
        );
        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, null);
        assert.deepEqual(hook.getState().data, {
            id: "goiania-node-1",
            name: "Bosque dos Buritis",
            category: "park",
            latitude: -16.67,
            longitude: -49.26,
            source: "openstreetmap",
        });
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("useLocation returns a controlled error and does not fetch when the id is empty", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    let fetchCalls = 0;

    globalThis.fetch = async () => {
        fetchCalls += 1;
        throw new Error("fetch should not be called");
    };

    try {
        const hook = renderHook("   ");

        await TestRenderer.act(async () => {
            await flushMicrotasks();
        });

        assert.equal(fetchCalls, 0);
        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, "Location id is required");
        assert.equal(hook.getState().data, null);
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("useLocation reload retries after an error and keeps the newest response", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    const requests = [
        createDeferred<Response>(),
        createDeferred<Response>(),
        createDeferred<Response>(),
    ];
    let requestIndex = 0;

    globalThis.fetch = async () => {
        const request = requests[requestIndex];
        requestIndex += 1;
        return request.promise;
    };

    try {
        const hook = renderHook("goiania-node-1");

        await TestRenderer.act(async () => {
            requests[0].resolve(
                createJsonResponse(
                    {
                        error: "Location service unavailable",
                    },
                    503,
                ),
            );
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, "Location service unavailable");
        assert.equal(hook.getState().data, null);

        await TestRenderer.act(async () => {
            hook.getState().reload();
            await flushMicrotasks();
        });

        await TestRenderer.act(async () => {
            hook.getState().reload();
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, true);
        assert.equal(hook.getState().error, null);

        await TestRenderer.act(async () => {
            requests[2].resolve(
                createJsonResponse({
                    id: "fresh-result",
                    name: "Biblioteca Central",
                    category: "library",
                    latitude: -16.68,
                    longitude: -49.25,
                    source: "fallback",
                }),
            );
            await flushMicrotasks();
        });

        await TestRenderer.act(async () => {
            requests[1].resolve(
                createJsonResponse({
                    id: "stale-result",
                    name: "Parque Mutirama",
                    category: "park",
                    latitude: -16.66,
                    longitude: -49.24,
                    source: "openstreetmap",
                }),
            );
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, null);
        assert.deepEqual(hook.getState().data, {
            id: "fresh-result",
            name: "Biblioteca Central",
            category: "library",
            latitude: -16.68,
            longitude: -49.25,
            source: "fallback",
        });
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("useLocation ignores pending responses after unmount", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    const request = createDeferred<Response>();
    globalThis.fetch = async () => request.promise;

    try {
        const hook = renderHook("goiania-node-1");
        hook.unmount();

        await TestRenderer.act(async () => {
            request.resolve(
                createJsonResponse({
                    id: "goiania-node-1",
                    name: "Bosque dos Buritis",
                    category: "park",
                    latitude: -16.67,
                    longitude: -49.26,
                    source: "openstreetmap",
                }),
            );
            await flushMicrotasks();
        });
        assert.ok(true);
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});
