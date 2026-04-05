import type { NavigationState } from "../types/redux";

function navigate(state: NavigationState, newPath: string, search?: string): NavigationState {
    window.history.pushState({}, "", newPath + (search || ""));
    return { path: newPath, search: search };
}

export default function(state: NavigationState = {}, action: any): NavigationState {
    switch(action.type) {
        case "NAVIGATE":
            state = navigate(state, action.newPath, action.search);
            break;
        case "SET_CONTEXT_MENU":
            state = Object.assign({}, state, {
                context: action.menu
            });
            break;
        case "SET_URL":
            history.replaceState({}, "", action.path);
            break;
    }

    return state;
}
