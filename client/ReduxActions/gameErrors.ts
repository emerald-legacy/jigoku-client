import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { GameErrorSummary, GameErrorRecord, RootState } from "../types/redux";
import { apiCall } from "./apiCall";

interface LoadGameErrorsOptions {
    forceLoad?: boolean;
    limit?: number;
    skip?: number;
}

export const loadGameErrors = createAsyncThunk(
    "gameErrors/load",
    (options: LoadGameErrorsOptions | undefined, { rejectWithValue }) => {
        const params: Record<string, unknown> = {};
        if(options && options.limit) {
            params.limit = options.limit;
        }
        if(options && options.skip) {
            params.skip = options.skip;
        }
        return apiCall<{ success: boolean; errors: GameErrorSummary[] }>(
            () => axios.get("/api/admin/game-errors", { params }),
            rejectWithValue
        );
    },
    {
        condition: (options, { getState }) => {
            const state = getState() as RootState;
            return !state.gameErrors.errors || state.gameErrors.errors.length === 0 || !!(options && options.forceLoad);
        }
    }
);

export const loadGameError = createAsyncThunk(
    "gameErrors/loadOne",
    (id: string, { rejectWithValue }) => apiCall<{ success: boolean; error: GameErrorRecord }>(
        () => axios.get(`/api/admin/game-errors/${id}`),
        rejectWithValue
    )
);

export const resolveGameError = createAsyncThunk(
    "gameErrors/resolve",
    async (id: string, { rejectWithValue }) => {
        const result = await apiCall<{ success: boolean }>(
            () => axios.delete(`/api/admin/game-errors/${id}`),
            rejectWithValue
        );
        return { ...result, id };
    }
);
