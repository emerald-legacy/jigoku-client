import axios from "axios";

export function fetchNews() {
    return dispatch => {
        dispatch(requestNews());

        return axios.get("/api/news")
            .then(response => {
                dispatch(receiveNews(response.data));
            });
    };
}

export function requestNews() {
    return {
        type: "REQUEST_NEWS"
    };
}

export function receiveNews(news) {
    return {
        type: "RECEIVE_NEWS",
        news: news
    };
}

export function loadNews(options) {
    return {
        types: ["REQUEST_NEWS", "RECEIVE_NEWS"],
        shouldCallAPI: (state) => {
            return !state.news.news || state.news.news.length === 0 || (options && !!options.forceLoad);
        },
        callAPI: () => {
            let params = {};

            if(options && options.limit) {
                params.limit = options.limit;
            }

            return axios.get("/api/news/", { params }).then(response => response.data);
        }
    };
}

export function addNews(newsText) {
    return {
        types: ["ADD_NEWS", "NEWS_ADDED"],
        shouldCallAPI: (state) => {
            return state.news.news;
        },
        callAPI: () => axios.put("/api/news", { text: newsText }).then(response => response.data)
    };
}

export function clearNewsStatus() {
    return {
        type: "CLEAR_NEWS_STATUS"
    };
}
