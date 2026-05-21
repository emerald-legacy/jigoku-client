import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Card } from "../types/game";
import type { Faction, Format, Pack } from "../types/deck";
import type { RootState } from "../types/redux";
import { apiCall } from "./apiCall";

export const loadCards = createAsyncThunk(
    "cards/load",
    (_, { rejectWithValue }) => apiCall<{ cards: Record<string, Card> }>(() => axios.get("/api/cards"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.cards }
);

export const loadPacks = createAsyncThunk(
    "cards/loadPacks",
    (_, { rejectWithValue }) => apiCall<{ packs: Pack[] }>(() => axios.get("/api/packs"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.packs }
);

export const loadFactions = createAsyncThunk(
    "cards/loadFactions",
    (_, { rejectWithValue }) => apiCall<{ factions: Faction[] }>(() => axios.get("/api/factions"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.factions }
);

export const loadFormats = createAsyncThunk(
    "cards/loadFormats",
    (_, { rejectWithValue }) => apiCall<{ formats: Format[] }>(() => axios.get("/api/formats"), rejectWithValue),
    { condition: (_, { getState }) => !(getState() as RootState).cards.formats }
);
