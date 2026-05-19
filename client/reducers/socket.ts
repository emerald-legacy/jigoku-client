import { SocketState } from "../types/redux";

export default function(state: SocketState = {} as SocketState, action: any): SocketState {
    switch(action.type) {
        case "SOCKET_CONNECTED":
            return Object.assign({}, state, {
                connected: true
            });
        case "SOCKET_DISCONNECTED":
            return Object.assign({}, state, {
                connected: false
            });
        case "GAME_SOCKET_CONNECTED":
            return Object.assign({}, state, {
                gameConnected: true,
                gameConnecting: false
            });
        case "GAME_SOCKET_CONNECTING":
            return Object.assign({}, state, {
                gameConnecting: true,
                gameHost: action.host
            });
        case "GAME_SOCKET_CONNECT_FAILED":
            return Object.assign({}, state, {
                gameConnecting: false,
                gameHost: undefined
            });
        case "GAME_SOCKET_CLOSED":
            return Object.assign({}, state, {
                gameConnected: false,
                gameConnecting: false,
                gameHost: undefined
            });
    }

    return state;
}
