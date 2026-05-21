import axios, { type AxiosError } from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "../types/user";
import { apiCall } from "./apiCall";
import { refreshUser } from "../reducers/user";
import { getLobbySocket } from "../socket";

export const loadBlockList = createAsyncThunk(
    "user/loadBlockList",
    (user: User, { rejectWithValue }) => apiCall<{ blockList: string[] }>(
        () => axios.get(`/api/account/${user.username}/blocklist`),
        rejectWithValue
    )
);

interface BlockListEntryArg {
    user: User;
    username: string;
}

export const addBlockListEntry = createAsyncThunk(
    "user/addBlockListEntry",
    ({ user, username }: BlockListEntryArg, { rejectWithValue }) => apiCall<{ username: string }>(
        () => axios.post(`/api/account/${user.username}/blocklist`, { username }),
        rejectWithValue
    )
);

export const removeBlockListEntry = createAsyncThunk(
    "user/removeBlockListEntry",
    ({ user, username }: BlockListEntryArg, { rejectWithValue }) => apiCall<{ username: string }>(
        () => axios.delete(`/api/account/${user.username}/blocklist/${username}`),
        rejectWithValue
    )
);

interface SaveProfileArg {
    user: User;
    payload: Record<string, unknown>;
}

interface SaveProfileResponse {
    success: boolean;
    message?: string;
    user: User;
    token: string;
}

export const saveProfile = createAsyncThunk(
    "user/saveProfile",
    async ({ user, payload }: SaveProfileArg, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put<SaveProfileResponse>(`/api/account/${user.username}`, {
                data: JSON.stringify(payload)
            });
            if(!response.data.success) {
                return rejectWithValue({ message: response.data.message, status: 200 });
            }
            getLobbySocket()?.emit("authenticate", response.data.token);
            dispatch(refreshUser(response.data.user, response.data.token));
            return response.data;
        } catch(error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }> | undefined;
            return rejectWithValue({
                message: axiosError?.response?.data?.message || "An error occurred while saving your profile",
                status: axiosError?.response?.status
            });
        }
    }
);
