import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NavigationState } from "../types/redux";

const navigationSlice = createSlice({
    name: "navigation",
    initialState: {} as NavigationState,
    reducers: {
        navigate(state, action: PayloadAction<{ newPath: string; search?: string }>) {
            const { newPath, search } = action.payload;
            window.history.pushState({}, "", newPath + (search || ""));
            state.path = newPath;
            state.search = search;
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
