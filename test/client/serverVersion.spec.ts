import { describe, it, expect, vi, beforeEach } from "vitest";

const axiosGet = vi.fn();
vi.mock("axios", () => ({ default: { get: (...args: any[]) => axiosGet(...args) } }));

import serverVersionReducer, { type ServerVersionState } from "../../client/reducers/serverVersion";
import { loadServerVersion } from "../../client/ReduxActions/serverVersion";

describe("serverVersion thunk", () => {
    beforeEach(() => {
        axiosGet.mockReset();
    });

    it("issues GET /api/server-version exactly once per dispatch", async () => {
        axiosGet.mockResolvedValue({ data: { nodes: [] } });
        const thunk = loadServerVersion();
        const dispatch = vi.fn();
        const getState = vi.fn(() => ({}));
        await thunk(dispatch, getState, undefined);
        expect(axiosGet).toHaveBeenCalledExactlyOnceWith("/api/server-version");
    });

    it("returns the nodes payload when the server responds with success", async () => {
        const nodes = [{ name: "node-1", version: "1.0" }];
        axiosGet.mockResolvedValue({ data: { nodes } });
        const dispatch = vi.fn();
        const result = await loadServerVersion()(dispatch, () => ({}), undefined);
        expect(result.payload).toEqual({ nodes });
        expect((result as any).meta.requestStatus).toBe("fulfilled");
    });

    it("rejects via apiCall when the request throws", async () => {
        axiosGet.mockRejectedValue({ response: { status: 503 } });
        const result = await loadServerVersion()(vi.fn(), () => ({}), undefined);
        expect((result as any).meta.requestStatus).toBe("rejected");
        expect((result.payload as any).status).toBe(503);
    });
});

describe("serverVersion reducer", () => {
    const initial: ServerVersionState = { nodes: [] };

    it("stores nodes from a fulfilled action", () => {
        const nodes = [{ name: "node-1", version: "1.0" }, { name: "node-2", version: "1.1" }];
        const next = serverVersionReducer(initial, {
            type: loadServerVersion.fulfilled.type,
            payload: { nodes },
            meta: {} as any
        });
        expect(next.nodes).toEqual(nodes);
    });

    it("falls back to an empty list when the payload has no nodes", () => {
        const next = serverVersionReducer({ nodes: [{ name: "old", version: "0" }] }, {
            type: loadServerVersion.fulfilled.type,
            payload: {},
            meta: {} as any
        });
        expect(next.nodes).toEqual([]);
    });

    it("clears nodes when the request is rejected (so a stale version is not displayed forever)", () => {
        const next = serverVersionReducer({ nodes: [{ name: "old", version: "0" }] }, {
            type: loadServerVersion.rejected.type,
            payload: { message: "boom" },
            meta: {} as any,
            error: {}
        });
        expect(next.nodes).toEqual([]);
    });

    it("ignores unrelated actions", () => {
        const next = serverVersionReducer(initial, { type: "other/action" });
        expect(next).toBe(initial);
    });
});
