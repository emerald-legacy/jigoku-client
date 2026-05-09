import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserState } from "../types/user";

const userSlice = createSlice({
    name: "user",
    initialState: {} as UserState,
    reducers: {
        refreshUser: {
            reducer(state, action: PayloadAction<{ user: any; token: string }>) {
                state.user = action.payload.user;
                state.username = action.payload.user.username;
                state.token = action.payload.token;
            },
            prepare(user: any, token: string) {
                return { payload: { user, token } };
            }
        },
        clearBlockListStatus(state) {
            state.blockListAdded = false;
            state.blockListDeleted = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase("RECEIVE_BLOCKLIST", (state: UserState, action: any) => {
                state.blockList = action.response.blockList;
            })
            .addCase("BLOCKLIST_ADDED", (state: UserState, action: any) => {
                state.blockListAdded = true;
                state.blockList.push(action.response.username);
            })
            .addCase("BLOCKLIST_DELETED", (state: UserState, action: any) => {
                state.blockListDeleted = true;
                state.blockList = state.blockList.filter((u: any) => u !== action.response.username);
            });
    }
});

export const { refreshUser, clearBlockListStatus } = userSlice.actions;
export default userSlice.reducer;
