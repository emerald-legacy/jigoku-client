import { http, HttpError, httpErrorStatus } from "../http";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "../types/user";
import { apiCall } from "./apiCall";
import { refreshUser } from "../reducers/user";
import { getLobbySocket } from "../socket";

export const loadBlockList = createAsyncThunk(
    "user/loadBlockList",
    (user: User, { rejectWithValue }) => apiCall<{ blockList: string[] }>(
        () => http.get(`/api/account/${user.username}/blocklist`),
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
        () => http.post(`/api/account/${user.username}/blocklist`, { username }),
        rejectWithValue
    )
);

export const removeBlockListEntry = createAsyncThunk(
    "user/removeBlockListEntry",
    ({ user, username }: BlockListEntryArg, { rejectWithValue }) => apiCall<{ username: string }>(
        () => http.delete(`/api/account/${user.username}/blocklist/${username}`),
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
            const response = await http.put<SaveProfileResponse>(`/api/account/${user.username}`, {
                data: JSON.stringify(payload)
            });
            if(!response.data.success) {
                return rejectWithValue({ message: response.data.message, status: 200 });
            }
            getLobbySocket()?.emit("authenticate", response.data.token);
            dispatch(refreshUser(response.data.user, response.data.token));
            return response.data;
        } catch(error: unknown) {
            const data = error instanceof HttpError ? error.data : undefined;
            const serverMessage = typeof data === "object" && data !== null && "message" in data && typeof data.message === "string" ? data.message : "";
            return rejectWithValue({
                message: serverMessage || "An error occurred while saving your profile",
                status: httpErrorStatus(error)
            });
        }
    }
);
