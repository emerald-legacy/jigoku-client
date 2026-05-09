import { createSlice } from "@reduxjs/toolkit";
import type { AdminState } from "../types/redux";

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
            .addCase("RECEIVE_FINDUSER", (state: AdminState, action: any) => {
                state.currentUser = action.response.user;
            })
            .addCase("SAVE_USER", (state: AdminState) => {
                state.userSaved = false;
            })
            .addCase("USER_SAVED", (state: AdminState) => {
                state.userSaved = true;
            });
    }
});

export const { clearUserStatus } = adminSlice.actions;
export default adminSlice.reducer;
