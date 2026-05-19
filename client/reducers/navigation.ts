import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NavigationState } from "../types/redux";

const navigationSlice = createSlice({
    name: "navigation",
    initialState: {} as NavigationState,
    reducers: {
        setPath(state, action: PayloadAction<string>) {
            state.path = action.payload;
        },
        setContextMenu(state, action: PayloadAction<any>) {
            state.context = action.payload;
        }
    }
});

export const { setPath, setContextMenu } = navigationSlice.actions;
export default navigationSlice.reducer;
