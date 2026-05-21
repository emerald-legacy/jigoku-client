import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiCall } from "./apiCall";

export const loadDeckStats = createAsyncThunk(
    "cards/loadDeckStats",
    (_, { rejectWithValue }) => apiCall(() => axios.get("/api/deckstats"), rejectWithValue)
);
