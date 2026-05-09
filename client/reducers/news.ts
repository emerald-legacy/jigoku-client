import { createSlice } from "@reduxjs/toolkit";
import type { NewsState } from "../types/redux";

const newsSlice = createSlice({
    name: "news",
    initialState: { news: [] } as NewsState,
    reducers: {
        clearNewsStatus(state) {
            state.newsSaved = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase("REQUEST_NEWS", (state: NewsState) => {
                state.newsSaved = false;
            })
            .addCase("RECEIVE_NEWS", (state: NewsState, action: any) => {
                state.newsSaved = false;
                state.news = action.response.news;
            })
            .addCase("NEWS_ADDED", (state: NewsState) => {
                state.newsSaved = true;
            });
    }
});

export const { clearNewsStatus } = newsSlice.actions;
export default newsSlice.reducer;
