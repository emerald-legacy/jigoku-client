import { http } from "../http";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "../types/user";
import { apiCall } from "./apiCall";

export const findUser = createAsyncThunk(
    "admin/findUser",
    (username: string, { rejectWithValue }) => apiCall<{ user: User }>(() => http.get(`/api/user/${username}`), rejectWithValue)
);

export const saveUser = createAsyncThunk(
    "admin/saveUser",
    (user: User, { rejectWithValue }) => apiCall(() => http.put(`/api/user/${user.username}`, {
        data: JSON.stringify(user)
    }), rejectWithValue)
);
