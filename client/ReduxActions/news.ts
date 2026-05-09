import axios from "axios";

export { clearNewsStatus } from "../reducers/news";

export function loadNews(options?: { forceLoad?: boolean; limit?: number }) {
    return {
        types: ["REQUEST_NEWS", "RECEIVE_NEWS"] as const,
        shouldCallAPI: (state: any) => {
            return !state.news.news || state.news.news.length === 0 || (options && !!options.forceLoad);
        },
        callAPI: () => {
            const params: Record<string, any> = {};

            if(options && options.limit) {
                params.limit = options.limit;
            }

            return axios.get("/api/news/", { params }).then(response => response.data);
        }
    };
}

export function addNews(newsText: string) {
    return {
        types: ["ADD_NEWS", "NEWS_ADDED"] as const,
        shouldCallAPI: (state: any) => {
            return state.news.news;
        },
        callAPI: () => axios.put("/api/news", { text: newsText }).then(response => response.data)
    };
}
