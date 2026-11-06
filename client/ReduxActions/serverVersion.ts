import { http } from "../http.js";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiCall } from "./apiCall.js";

export interface ServerVersionNode {
    name: string;
    version: string;
}

export interface ServerVersionResponse {
    nodes?: ServerVersionNode[];
}

export const loadServerVersion = createAsyncThunk<ServerVersionResponse>(
    "serverVersion/load",
    (_, { rejectWithValue }) => apiCall(() => http.get("/api/server-version"), rejectWithValue)
);
