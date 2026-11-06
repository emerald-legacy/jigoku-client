export interface HttpResponse<T> {
    data: T;
    status: number;
}

export class HttpError extends Error {
    readonly status: number;
    readonly data: unknown;

    constructor(status: number, data: unknown) {
        super(`Request failed with status code ${status}`);
        this.name = "HttpError";
        this.status = status;
        this.data = data;
    }
}

type ErrorStatusHandler = (status: number) => void;

const errorStatusHandlers = new Set<ErrorStatusHandler>();

export function onHttpErrorStatus(handler: ErrorStatusHandler): () => void {
    errorStatusHandlers.add(handler);
    return () => {
        errorStatusHandlers.delete(handler);
    };
}

export function httpErrorStatus(error: unknown): number | undefined {
    return error instanceof HttpError ? error.status : undefined;
}

interface GetOptions {
    params?: Record<string, string | number>;
}

function withParams(url: string, params?: Record<string, string | number>): string {
    if(!params) {
        return url;
    }
    const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();
    if(!query) {
        return url;
    }
    return url + (url.includes("?") ? "&" : "?") + query;
}

function parseBody(text: string): unknown {
    if(!text) {
        return "";
    }
    try {
        return JSON.parse(text);
    } catch(_error) {
        return text;
    }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<HttpResponse<T>> {
    const headers: Record<string, string> = { Accept: "application/json, text/plain, */*" };
    const init: RequestInit = { method, headers };
    if(body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);
    const data = parseBody(await response.text());

    if(!response.ok) {
        for(const handler of errorStatusHandlers) {
            handler(response.status);
        }
        throw new HttpError(response.status, data);
    }

    return { data: data as T, status: response.status };
}

export const http = {
    get: <T = unknown>(url: string, options?: GetOptions) => request<T>("GET", withParams(url, options?.params)),
    post: <T = unknown>(url: string, body?: unknown) => request<T>("POST", url, body),
    put: <T = unknown>(url: string, body?: unknown) => request<T>("PUT", url, body),
    delete: <T = unknown>(url: string) => request<T>("DELETE", url)
};
