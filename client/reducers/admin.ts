import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminState } from "../types/redux";
import type { User } from "../types/user";
import { findUser, saveUser } from "../ReduxActions/admin";
import { addLoadingMatchers } from "./loadingMatchers";

const adminSlice = createSlice({
    name: "admin",
    initialState: {} as AdminState,
    reducers: {
        clearUserStatus(state) {
            state.userSaved = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(findUser.fulfilled, (state: AdminState, action: PayloadAction<{ user: User }>) => {
                state.currentUser = action.payload.user;
            })
            .addCase(saveUser.pending, (state: AdminState) => {
                state.userSaved = false;
            })
            .addCase(saveUser.fulfilled, (state: AdminState) => {
                state.userSaved = true;
            });
        addLoadingMatchers(builder, "admin");
    }
});

export const { clearUserStatus } = adminSlice.actions;
export default adminSlice.reducer;
