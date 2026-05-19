import { createSlice } from "@reduxjs/toolkit";
import type { Action } from "@reduxjs/toolkit";
import type { ApiState } from "../types/redux";

interface ThunkAction extends Action<string> {
    meta?: { requestStatus?: "pending" | "fulfilled" | "rejected" };
    payload?: { message?: string; status?: number };
    error?: { message?: string };
}

const isPending = (action: Action): action is ThunkAction =>
    (action as ThunkAction).meta?.requestStatus === "pending";
const isFulfilled = (action: Action): action is ThunkAction =>
    (action as ThunkAction).meta?.requestStatus === "fulfilled";
const isRejected = (action: Action): action is ThunkAction =>
    (action as ThunkAction).meta?.requestStatus === "rejected";

const apiSlice = createSlice({
    name: "api",
    initialState: {} as ApiState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addMatcher(isPending, (state: ApiState) => {
                const count = (state.loadingCount || 0) + 1;
                state.status = undefined;
                state.message = undefined;
                state.loading = true;
                state.loadingCount = count;
            })
            .addMatcher(isFulfilled, (state: ApiState) => {
                const count = Math.max((state.loadingCount || 0) - 1, 0);
                state.loading = count > 0;
                state.loadingCount = count;
                state.message = undefined;
            })
            .addMatcher(isRejected, (state: ApiState, action: ThunkAction) => {
                const count = Math.max((state.loadingCount || 0) - 1, 0);
                state.status = action.payload?.status;
                state.message = action.payload?.message ?? action.error?.message;
                state.loading = count > 0;
                state.loadingCount = count;
            });
    }
});

export default apiSlice.reducer;
