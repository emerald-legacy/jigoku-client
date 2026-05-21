import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NewsState } from "../types/redux";
import { loadNews, addNews } from "../ReduxActions/news";
import { addLoadingMatchers } from "./loadingMatchers";

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
            .addCase(loadNews.pending, (state: NewsState) => {
                state.newsSaved = false;
            })
            .addCase(loadNews.fulfilled, (state: NewsState, action: PayloadAction<any>) => {
                state.newsSaved = false;
                state.news = action.payload.news;
            })
            .addCase(addNews.fulfilled, (state: NewsState) => {
                state.newsSaved = true;
            });
        addLoadingMatchers(builder, "news");
    }
});

export const { clearNewsStatus } = newsSlice.actions;
export default newsSlice.reducer;
