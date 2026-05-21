import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiCall } from "./apiCall";
import { refreshUser } from "../reducers/user";
import { getLobbySocket } from "../socket";

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

interface SaveProfileArg {
    user: any;
    payload: any;
}

export const saveProfile = createAsyncThunk(
    "user/saveProfile",
    async ({ user, payload }: SaveProfileArg, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put(`/api/account/${user.username}`, {
                data: JSON.stringify(payload)
            });
            if(!response.data.success) {
                return rejectWithValue({ message: response.data.message, status: 200 });
            }
            getLobbySocket()?.emit("authenticate", response.data.token);
            dispatch(refreshUser(response.data.user, response.data.token));
            return response.data;
        } catch(error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "An error occurred while saving your profile",
                status: error?.response?.status
            });
        }
    }
);
