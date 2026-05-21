import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User, UserState } from "../types/user";
import { loadBlockList, addBlockListEntry, removeBlockListEntry } from "../ReduxActions/user";
import { addLoadingMatchers } from "./loadingMatchers";

const userSlice = createSlice({
    name: "user",
    initialState: {} as UserState,
    reducers: {
        refreshUser: {
            reducer(state, action: PayloadAction<{ user: User; token: string }>) {
                state.user = action.payload.user;
                state.username = action.payload.user.username;
                state.token = action.payload.token;
            },
            prepare(user: User, token: string) {
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
            .addCase(loadBlockList.fulfilled, (state: UserState, action: PayloadAction<{ blockList: string[] }>) => {
                state.blockList = action.payload.blockList;
            })
            .addCase(addBlockListEntry.fulfilled, (state: UserState, action: PayloadAction<{ username: string }>) => {
                state.blockListAdded = true;
                if(!state.blockList) {
                    state.blockList = [];
                }
                state.blockList.push(action.payload.username);
            })
            .addCase(removeBlockListEntry.fulfilled, (state: UserState, action: PayloadAction<{ username: string }>) => {
                state.blockListDeleted = true;
                if(state.blockList) {
                    state.blockList = state.blockList.filter((u: string) => u !== action.payload.username);
                }
            });
        addLoadingMatchers(builder, "user");
    }
});

export const { refreshUser, clearBlockListStatus } = userSlice.actions;
export default userSlice.reducer;
