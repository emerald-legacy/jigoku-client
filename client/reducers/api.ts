import { createSlice } from "@reduxjs/toolkit";
import type { ApiState } from "../types/redux";

const apiSlice = createSlice({
    name: "api",
    initialState: {} as ApiState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase("API_LOADING", (state: ApiState) => {
                const count = (state.loadingCount || 0) + 1;
                state.status = undefined;
                state.message = undefined;
                state.loading = count > 0;
                state.loadingCount = count;
            })
            .addCase("API_LOADED", (state: ApiState) => {
                const count = (state.loadingCount || 0) - 1;
                state.loading = count > 0;
                state.loadingCount = count;
                state.message = undefined;
            })
            .addCase("API_FAILURE", (state: ApiState, action: any) => {
                const count = (state.loadingCount || 0) - 1;
                state.status = action.status;
                state.message = action.message;
                state.loading = count > 0;
                state.loadingCount = count;
            });
    }
});

export default apiSlice.reducer;
