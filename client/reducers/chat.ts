import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChatState } from "../types/redux";

const chatSlice = createSlice({
    name: "chat",
    initialState: {} as ChatState,
    reducers: {
        receiveBannerNotice(state, action: PayloadAction<string>) {
            state.notice = action.payload;
        }
    }
});

export const { receiveBannerNotice } = chatSlice.actions;
export default chatSlice.reducer;
