import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../types/redux";
import { apiCall } from "./apiCall";

export { clearNewsStatus } from "../reducers/news";

interface LoadNewsOptions {
    forceLoad?: boolean;
    limit?: number;
}

export const loadNews = createAsyncThunk(
    "news/load",
    (options: LoadNewsOptions | undefined, { rejectWithValue }) => {
        const params: Record<string, any> = {};
        if(options && options.limit) {
            params.limit = options.limit;
        }
        return apiCall(() => axios.get("/api/news/", { params }), rejectWithValue);
    },
    {
        condition: (options, { getState }) => {
            const state = getState() as RootState;
            return !state.news.news || state.news.news.length === 0 || !!(options && options.forceLoad);
        }
    }
);

export const addNews = createAsyncThunk(
    "news/add",
    (newsText: string, { rejectWithValue }) => apiCall(() => axios.put("/api/news", { text: newsText }), rejectWithValue),
    { condition: (_, { getState }) => !!(getState() as RootState).news.news }
);
