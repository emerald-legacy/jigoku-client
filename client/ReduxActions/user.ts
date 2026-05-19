import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiCall } from "./apiCall";

export { refreshUser, clearBlockListStatus } from "../reducers/user";

export const loadBlockList = createAsyncThunk(
    "user/loadBlockList",
    (user: any, { rejectWithValue }) => apiCall(() => axios.get(`/api/account/${user.username}/blocklist`), rejectWithValue)
);

interface BlockListEntryArg {
    user: any;
    username: string;
}

export const addBlockListEntry = createAsyncThunk(
    "user/addBlockListEntry",
    ({ user, username }: BlockListEntryArg, { rejectWithValue }) => apiCall(
        () => axios.post(`/api/account/${user.username}/blocklist`, { username }),
        rejectWithValue
    )
);

export const removeBlockListEntry = createAsyncThunk(
    "user/removeBlockListEntry",
    ({ user, username }: BlockListEntryArg, { rejectWithValue }) => apiCall(
        () => axios.delete(`/api/account/${user.username}/blocklist/${username}`),
        rejectWithValue
    )
);
