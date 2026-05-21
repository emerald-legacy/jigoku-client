import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiCall } from "./apiCall";

export { clearUserStatus } from "../reducers/admin";

export const findUser = createAsyncThunk(
    "admin/findUser",
    (username: string, { rejectWithValue }) => apiCall(() => axios.get(`/api/user/${username}`), rejectWithValue)
);

export const saveUser = createAsyncThunk(
    "admin/saveUser",
    (user: any, { rejectWithValue }) => apiCall(() => axios.put(`/api/user/${user.username}`, {
        data: JSON.stringify(user)
    }), rejectWithValue)
);
