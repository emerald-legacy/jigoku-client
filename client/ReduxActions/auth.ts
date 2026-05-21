import axios, { type AxiosError } from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "../types/user";
import { register, login, logout } from "../reducers/auth";
import { apiCall } from "./apiCall";
import { getLobbySocket } from "../socket";

export { register, login, logout };

interface LoginArg {
    username: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    message?: string;
    user: User & { admin?: boolean };
    token: string;
}

export const loginUser = createAsyncThunk(
    "auth/login",
    async ({ username, password }: LoginArg, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.post<LoginResponse>("/api/account/login", { username, password });
            if(!response.data.success) {
                return rejectWithValue({ message: response.data.message, status: 200 });
            }
            dispatch(login({ user: response.data.user, token: response.data.token, isAdmin: !!response.data.user.admin }));
            getLobbySocket()?.emit("authenticate", response.data.token);
            return response.data;
        } catch(error: unknown) {
            const axiosError = error as AxiosError | undefined;
            const status = axiosError?.response?.status;
            if(status === 401) {
                return rejectWithValue({ message: "Invalid Username/password", status });
            }
            return rejectWithValue({
                message: "Could not communicate with the server.  Please try again later.",
                status
            });
        }
    }
);

export async function checkUsername(username: string): Promise<{ message?: string }> {
    try {
        const response = await axios.post<{ message?: string }>("/api/account/check-username", { username });
        return response.data ?? {};
    } catch(_error) {
        return {};
    }
}

interface RegisterArg {
    username: string;
    password: string;
    email: string;
}

interface RegisterResponse {
    success: boolean;
    message?: string;
    user: User;
    token: string;
}

export const registerUser = createAsyncThunk(
    "auth/register",
    async (arg: RegisterArg, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.post<RegisterResponse>("/api/account/register", arg);
            const data = response.data;
            if(!data.success) {
                return rejectWithValue({ message: data.message, status: 200 });
            }
            dispatch(register({ user: data.user, token: data.token }));
            getLobbySocket()?.emit("authenticate", data.token);
            return data;
        } catch(_error) {
            return rejectWithValue({
                message: "Could not communicate with the server.  Please try again later."
            });
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { dispatch }) => {
        try {
            await axios.post("/api/account/logout");
        } catch(_error) {
            // Logout always proceeds locally even if server call fails.
        }
        dispatch(logout());
    }
);

interface PasswordResetArg {
    username: string;
    captcha: string;
}

export const requestPasswordReset = createAsyncThunk(
    "auth/requestPasswordReset",
    (arg: PasswordResetArg, { rejectWithValue }) => apiCall(
        () => axios.post("/api/account/password-reset", arg),
        rejectWithValue
    )
);

interface FinishResetArg {
    id: string;
    token: string;
    newPassword: string;
}

export const finishPasswordReset = createAsyncThunk(
    "auth/finishPasswordReset",
    (arg: FinishResetArg, { rejectWithValue }) => apiCall(
        () => axios.post("/api/account/password-reset-finish", arg),
        rejectWithValue
    )
);
