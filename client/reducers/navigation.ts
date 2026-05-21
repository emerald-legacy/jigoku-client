import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NavigationState } from "../types/redux";

const navigationSlice = createSlice({
    name: "navigation",
    initialState: {} as NavigationState,
    reducers: {
        setContextMenu(state, action: PayloadAction<any>) {
            state.context = action.payload;
        }
    }
});

export const { setContextMenu } = navigationSlice.actions;
export default navigationSlice.reducer;
