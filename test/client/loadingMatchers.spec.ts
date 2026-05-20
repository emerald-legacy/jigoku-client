import { describe, it, expect } from "vitest";
import { createSlice } from "@reduxjs/toolkit";
import { addLoadingMatchers } from "../../client/reducers/loadingMatchers";

interface DemoState {
    loading?: boolean;
    other?: string;
}

function buildSlice(prefix: string) {
    return createSlice({
        name: prefix,
        initialState: {} as DemoState,
        reducers: {},
        extraReducers: (builder) => {
            addLoadingMatchers(builder, prefix);
        }
    });
}

describe("addLoadingMatchers", () => {
    it("flips loading=true on any pending action whose type starts with the slice prefix", () => {
        const slice = buildSlice("news");
        const next = slice.reducer({} as DemoState, { type: "news/load/pending" });
        expect(next.loading).toBe(true);
    });

    it("flips loading=false on the matching fulfilled action", () => {
        const slice = buildSlice("news");
        const pending = slice.reducer({} as DemoState, { type: "news/load/pending" });
        const fulfilled = slice.reducer(pending, { type: "news/load/fulfilled" });
        expect(fulfilled.loading).toBe(false);
    });

    it("flips loading=false on the matching rejected action", () => {
        const slice = buildSlice("admin");
        const pending = slice.reducer({} as DemoState, { type: "admin/save/pending" });
        const rejected = slice.reducer(pending, { type: "admin/save/rejected" });
        expect(rejected.loading).toBe(false);
    });

    it("does not react to thunks from a different slice prefix (this is the whole point of per-slice loading)", () => {
        const slice = buildSlice("news");
        const next = slice.reducer({} as DemoState, { type: "cards/load/pending" });
        expect(next.loading).toBeUndefined();
    });

    it("does not react to non-thunk plain actions inside the same prefix", () => {
        const slice = buildSlice("news");
        const next = slice.reducer({} as DemoState, { type: "news/clearStatus" });
        expect(next.loading).toBeUndefined();
    });

    it("preserves unrelated state when toggling loading", () => {
        const slice = buildSlice("news");
        const start: DemoState = { other: "untouched" };
        const next = slice.reducer(start, { type: "news/load/pending" });
        expect(next.other).toBe("untouched");
    });
});
