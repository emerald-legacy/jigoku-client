import { NewsState } from "../types/redux";

function news(state: NewsState = {
    news: []
} as NewsState, action: any): NewsState {
    switch(action.type) {
        case "REQUEST_NEWS":
            return Object.assign({}, state, {
                newsSaved: false
            });
        case "RECEIVE_NEWS":
            return Object.assign({}, state, {
                newsSaved: false,
                news: action.response.news
            });
        case "NEWS_ADDED":
            return Object.assign({}, state, {
                newsSaved: true
            });
        case "CLEAR_NEWS_STATUS":
            return Object.assign({}, state, {
                newsSaved: false
            });
        default:
            return state;
    }
}

export default news;
