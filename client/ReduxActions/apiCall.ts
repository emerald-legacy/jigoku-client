import type { AxiosResponse } from "axios";

export interface ApiFailure {
    message: string;
    status?: number;
}

export async function apiCall<T = any>(
    request: () => Promise<AxiosResponse<any>>,
    rejectWithValue: (value: ApiFailure) => any
): Promise<T> {
    try {
        const response = await request();
        if(response.data && response.data.success === false) {
            return rejectWithValue({ message: response.data.message, status: 200 });
        }
        return response.data;
    } catch(error: any) {
        return rejectWithValue({
            message: "An error occured communicating with the server.  Please try again later.",
            status: error?.response?.status
        });
    }
}
