import axios from "axios";

export function fetchNews() {
    return (dispatch: any) => {
        dispatch(requestNews());

        return axios.get("/api/news")
            .then(response => {
                dispatch(receiveNews(response.data));
            });
    };
}

export function requestNews() {
    return {
        type: "REQUEST_NEWS" as const
    };
}

export function receiveNews(news: any) {
    return {
        type: "RECEIVE_NEWS" as const,
        news: news
    };
}

export function loadNews(options?: { forceLoad?: boolean; limit?: number }) {
    return {
        types: ["REQUEST_NEWS", "RECEIVE_NEWS"] as const,
        shouldCallAPI: (state: any) => {
            return !state.news.news || state.news.news.length === 0 || (options && !!options.forceLoad);
        },
        callAPI: () => {
            let params: Record<string, any> = {};

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

export function clearNewsStatus() {
    return {
        type: "CLEAR_NEWS_STATUS" as const
    };
}
