import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChatState } from "../types/redux";

const chatSlice = createSlice({
    name: "chat",
    initialState: {} as ChatState,
    reducers: {
        receiveBannerNotice(state, action: PayloadAction<string>) {
            state.notice = action.payload;
        },
        clearBannerNotice(state) {
            state.notice = undefined;
        }
    }
});

export const { receiveBannerNotice, clearBannerNotice } = chatSlice.actions;
export default chatSlice.reducer;
