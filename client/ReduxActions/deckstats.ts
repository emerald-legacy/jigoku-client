import { http } from "../http";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { DeckStatus } from "../types/deck";
import { apiCall } from "./apiCall";

export const loadDeckStats = createAsyncThunk(
    "cards/loadDeckStats",
    (_, { rejectWithValue }) => apiCall<{ stats: Record<string, DeckStatus> }>(() => http.get("/api/deckstats"), rejectWithValue)
);
