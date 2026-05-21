import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiCall } from "./apiCall";

export interface ServerVersionNode {
    name: string;
    version: string;
}

export interface ServerVersionResponse {
    nodes?: ServerVersionNode[];
}

export const loadServerVersion = createAsyncThunk<ServerVersionResponse>(
    "serverVersion/load",
    (_, { rejectWithValue }) => apiCall(() => axios.get("/api/server-version"), rejectWithValue)
);
