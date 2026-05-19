import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminState } from "../types/redux";
import { findUser, saveUser } from "../ReduxActions/admin";

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
            .addCase(findUser.fulfilled, (state: AdminState, action: PayloadAction<any>) => {
                state.currentUser = action.payload.user;
            })
            .addCase(saveUser.pending, (state: AdminState) => {
                state.userSaved = false;
            })
            .addCase(saveUser.fulfilled, (state: AdminState) => {
                state.userSaved = true;
            });
    }
});

export const { clearUserStatus } = adminSlice.actions;
export default adminSlice.reducer;
