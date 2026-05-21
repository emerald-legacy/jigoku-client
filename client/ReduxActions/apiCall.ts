import type { AxiosError, AxiosResponse } from "axios";

export interface ApiFailure {
    message: string;
    status?: number;
}

interface ApiResponseEnvelope {
    success?: boolean;
    message?: string;
}

export async function apiCall<T = unknown>(
    request: () => Promise<AxiosResponse<T & ApiResponseEnvelope>>,
    rejectWithValue: (value: ApiFailure) => unknown
): Promise<T> {
    try {
        const response = await request();
        const data = response.data;
        if(data && data.success === false) {
            return rejectWithValue({ message: data.message ?? "", status: 200 }) as T;
        }
        return data as T;
    } catch(error: unknown) {
        const axiosError = error as AxiosError | undefined;
        return rejectWithValue({
            message: "An error occured communicating with the server.  Please try again later.",
            status: axiosError?.response?.status
        }) as T;
    }
}
