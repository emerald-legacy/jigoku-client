import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NavigationState } from "../types/redux";

const navigationSlice = createSlice({
    name: "navigation",
    initialState: {} as NavigationState,
    reducers: {
        navigate(state, action: PayloadAction<string>) {
            window.history.pushState({}, "", action.payload);
            state.path = action.payload;
        },
        setContextMenu(state, action: PayloadAction<any>) {
            state.context = action.payload;
        },
        setUrl(_state, action: PayloadAction<string>) {
            history.replaceState({}, "", action.payload);
        }
    }
});

export const { navigate, setContextMenu, setUrl } = navigationSlice.actions;
export default navigationSlice.reducer;
