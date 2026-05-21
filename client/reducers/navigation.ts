import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NavigationState } from "../types/redux";

type ContextMenuPayload = { x: number; y: number; menuId?: string } | undefined;

const navigationSlice = createSlice({
    name: "navigation",
    initialState: {} as NavigationState,
    reducers: {
        setContextMenu(state, action: PayloadAction<ContextMenuPayload>) {
            state.context = action.payload;
        }
    }
});

export const { setContextMenu } = navigationSlice.actions;
export default navigationSlice.reducer;
