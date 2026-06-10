import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import TestRenderer from "react-test-renderer";

import { useLocations } from "./useLocations";

(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Location = {
    id: string;
    name: string;
    category: "park" | "library" | "cafe" | "museum" | "bookstore";
    latitude: number;
    longitude: number;
    source: "openstreetmap" | "fallback";
};

type HookState = ReturnType<typeof useLocations>;

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

function renderHook() {
    let latestState: HookState | undefined;

    function Probe() {
        latestState = useLocations();
        return null;
    }

    let renderer!: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
        renderer = TestRenderer.create(<Probe />);
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

test("useLocations starts loading on mount and exposes data after success", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    const request = createDeferred<Response>();

    globalThis.fetch = async () => request.promise;

    try {
        const hook = renderHook();

        assert.equal(hook.getState().isLoading, true);
        assert.equal(hook.getState().error, null);
        assert.deepEqual(hook.getState().data, []);

        await TestRenderer.act(async () => {
            request.resolve(
                createJsonResponse({
                    locations: [
                        {
                            id: "goiania-park-1",
                            name: "Bosque dos Buritis",
                            category: "park",
                            latitude: -16.67,
                            longitude: -49.26,
                            source: "openstreetmap",
                        } satisfies Location,
                    ],
                }),
            );
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, null);
        assert.deepEqual(hook.getState().data, [
            {
                id: "goiania-park-1",
                name: "Bosque dos Buritis",
                category: "park",
                latitude: -16.67,
                longitude: -49.26,
                source: "openstreetmap",
            },
        ]);
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("useLocations reload retries after an error and clears the previous error on success", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    const requests = [createDeferred<Response>(), createDeferred<Response>()];
    let requestIndex = 0;

    globalThis.fetch = async () => {
        const request = requests[requestIndex];
        requestIndex += 1;
        return request.promise;
    };

    try {
        const hook = renderHook();

        await TestRenderer.act(async () => {
            requests[0].resolve(
                createJsonResponse(
                    {
                        error: "Worker unavailable",
                    },
                    503,
                ),
            );
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, "Worker unavailable");
        assert.deepEqual(hook.getState().data, []);

        await TestRenderer.act(async () => {
            hook.getState().reload();
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, true);
        assert.equal(hook.getState().error, null);

        await TestRenderer.act(async () => {
            requests[1].resolve(
                createJsonResponse({
                    locations: [
                        {
                            id: "goiania-library-1",
                            name: "Biblioteca Central",
                            category: "library",
                            latitude: -16.68,
                            longitude: -49.25,
                            source: "fallback",
                        } satisfies Location,
                    ],
                }),
            );
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, null);
        assert.deepEqual(hook.getState().data, [
            {
                id: "goiania-library-1",
                name: "Biblioteca Central",
                category: "library",
                latitude: -16.68,
                longitude: -49.25,
                source: "fallback",
            },
        ]);
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("useLocations keeps the newest reload result when responses resolve out of order", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    const requests = [createDeferred<Response>(), createDeferred<Response>()];
    let requestIndex = 0;

    globalThis.fetch = async () => {
        const request = requests[requestIndex];
        requestIndex += 1;
        return request.promise;
    };

    try {
        const hook = renderHook();

        await TestRenderer.act(async () => {
            hook.getState().reload();
            await flushMicrotasks();
        });

        await TestRenderer.act(async () => {
            requests[1].resolve(
                createJsonResponse({
                    locations: [
                        {
                            id: "latest-result",
                            name: "Parque Vaca Brava",
                            category: "park",
                            latitude: -16.7,
                            longitude: -49.27,
                            source: "openstreetmap",
                        } satisfies Location,
                    ],
                }),
            );
            await flushMicrotasks();
        });

        await TestRenderer.act(async () => {
            requests[0].resolve(
                createJsonResponse({
                    locations: [
                        {
                            id: "stale-result",
                            name: "Praça Cívica",
                            category: "park",
                            latitude: -16.68,
                            longitude: -49.26,
                            source: "fallback",
                        } satisfies Location,
                    ],
                }),
            );
            await flushMicrotasks();
        });

        assert.equal(hook.getState().isLoading, false);
        assert.equal(hook.getState().error, null);
        assert.deepEqual(hook.getState().data, [
            {
                id: "latest-result",
                name: "Parque Vaca Brava",
                category: "park",
                latitude: -16.7,
                longitude: -49.27,
                source: "openstreetmap",
            },
        ]);
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("useLocations ignores pending responses after unmount", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    const request = createDeferred<Response>();
    globalThis.fetch = async () => request.promise;

    try {
        const hook = renderHook();
        hook.unmount();

        await TestRenderer.act(async () => {
            request.resolve(
                createJsonResponse({
                    locations: [],
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
