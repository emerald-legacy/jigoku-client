import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadServerVersion, type ServerVersionNode, type ServerVersionResponse } from "../ReduxActions/serverVersion.js";

export interface ServerVersionState {
    nodes: ServerVersionNode[];
}

const serverVersionSlice = createSlice({
    name: "serverVersion",
    initialState: { nodes: [] } as ServerVersionState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loadServerVersion.fulfilled, (state, action: PayloadAction<ServerVersionResponse>) => {
                state.nodes = action.payload.nodes || [];
            })
            .addCase(loadServerVersion.rejected, (state) => {
                state.nodes = [];
            });
    }
});

export default serverVersionSlice.reducer;
