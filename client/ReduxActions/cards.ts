import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../types/redux";
import { apiCall } from "./apiCall";

export const loadCards = createAsyncThunk(
    "cards/load",
    (_, { rejectWithValue }) => apiCall(() => axios.get("/api/cards"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.cards }
);

export const loadPacks = createAsyncThunk(
    "cards/loadPacks",
    (_, { rejectWithValue }) => apiCall(() => axios.get("/api/packs"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.packs }
);

export const loadFactions = createAsyncThunk(
    "cards/loadFactions",
    (_, { rejectWithValue }) => apiCall(() => axios.get("/api/factions"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.factions }
);

export const loadFormats = createAsyncThunk(
    "cards/loadFormats",
    (_, { rejectWithValue }) => apiCall(() => axios.get("/api/formats"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.formats }
);
