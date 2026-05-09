import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState } from "../types/user";
import { refreshUser } from "./user";

const authSlice = createSlice({
    name: "auth",
    initialState: {} as AuthState,
    reducers: {
        register(state, action: PayloadAction<{ user: any; token: string }>) {
            const { user, token } = action.payload;
            state.user = user;
            state.username = user.username;
            state.token = token;
            state.loggedIn = true;
            if(!state.user.permissions) {
                state.user.permissions = {};
            }
        },
        login(state, action: PayloadAction<{ user: any; token: string; isAdmin: boolean }>) {
            const { user, token, isAdmin } = action.payload;
            state.user = user;
            state.username = user.username;
            state.token = token;
            state.isAdmin = isAdmin;
            state.loggedIn = true;
        },
        logout(state) {
            state.user = undefined;
            state.username = undefined;
            state.token = undefined;
            state.isAdmin = false;
            state.loggedIn = false;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(refreshUser, (state, action) => {
            state.user = action.payload.user;
            state.username = action.payload.user.username;
            state.token = action.payload.token;
        });
    }
});

export const { register, login, logout } = authSlice.actions;
export default authSlice.reducer;
