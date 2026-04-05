import { AdminState } from "../types/redux";

export default function(state: AdminState = {} as AdminState, action: any): AdminState {
    switch(action.type) {
        case "RECEIVE_FINDUSER":
            return Object.assign({}, state, {
                currentUser: action.response.user
            });
        case "SAVE_USER":
            return Object.assign({}, state, {
                userSaved: false
            });
        case "USER_SAVED":
            return Object.assign({}, state, {
                userSaved: true
            });
        case "CLEAR_USER_STATUS":
            return Object.assign({}, state, {
                userSaved: false
            });
    }

    return state;
}
