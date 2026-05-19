import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../types/redux";
import { apiCall } from "./apiCall";

export const loadGameStats = createAsyncThunk(
    "games/loadGameStats",
    (_, { rejectWithValue }) => apiCall(() => axios.get("/api/gamestats"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).games.gameStats }
);
