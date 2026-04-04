function chat(state = {}, action) {
    switch(action.type) {
        case "RECEIVE_BANNER_NOTICE":
            return Object.assign({}, state, {
                notice: action.notice
            });
        default:
            return state;
    }
}

export default chat;
