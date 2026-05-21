import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "../types/user";
import { apiCall } from "./apiCall";

export const findUser = createAsyncThunk(
    "admin/findUser",
    (username: string, { rejectWithValue }) => apiCall<{ user: User }>(() => axios.get(`/api/user/${username}`), rejectWithValue)
);

export const saveUser = createAsyncThunk(
    "admin/saveUser",
    (user: User, { rejectWithValue }) => apiCall(() => axios.put(`/api/user/${user.username}`, {
        data: JSON.stringify(user)
    }), rejectWithValue)
);
