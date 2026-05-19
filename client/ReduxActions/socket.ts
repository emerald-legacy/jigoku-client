import type { Dispatch } from "redux";
import { getLobbySocket, getGameSocket, setGameSocket } from "../socket";

export function socketConnected() {
    return {
        type: "SOCKET_CONNECTED" as const
    };
}

export function socketDisconnected() {
    return {
        type: "SOCKET_DISCONNECTED" as const
    };
}

export function socketMessageSent(message: string) {
    return {
        type: "SOCKET_MESSAGE_SENT" as const,
        message: message
    };
}

export function sendSocketMessage(message: string, ...args: any[]) {
    return (dispatch: Dispatch) => {
        const socket = getLobbySocket();
        if(socket) {
            socket.emit(message, ...args);
        }
        return dispatch(socketMessageSent(message));
    };
}

export function sendGameMessage(message: string, ...args: any[]) {
    return (dispatch: Dispatch) => {
        const socket = getGameSocket();
        if(socket) {
            socket.emit("game", message, ...args);
        }
        return dispatch(socketMessageSent(message));
    };
}

export function gameSocketConnected() {
    return {
        type: "GAME_SOCKET_CONNECTED" as const
    };
}

export function gameSocketConnectError() {
    return {
        type: "GAME_SOCKET_CONNECT_ERROR" as const
    };
}

export function gameSocketDisconnect() {
    return {
        type: "GAME_SOCKET_DISCONNETED" as const
    };
}

export function gameSocketReconnecting(attemptNumber?: number) {
    return {
        type: "GAME_SOCKET_RECONNECTED" as const,
        attemptNumber
    };
}

export function gameSocketConnecting(host: string) {
    return {
        type: "GAME_SOCKET_CONNECTING" as const,
        host: host
    };
}

export function gameSocketConnectFailed() {
    return {
        type: "GAME_SOCKET_CONNECT_FAILED" as const
    };
}

export function sendGameSocketConnectFailed() {
    return (dispatch: Dispatch) => {
        const socket = getLobbySocket();
        if(socket) {
            socket.emit("connectfailed");
        }
        return dispatch(gameSocketConnectFailed());
    };
}

export function gameSocketClosed(message?: string) {
    return {
        type: "GAME_SOCKET_CLOSED" as const,
        message: message
    };
}

export function gameSocketClose() {
    return (dispatch: Dispatch) => {
        return dispatch(gameSocketClosed());
    };
}

export function closeGameSocket() {
    return (dispatch: Dispatch) => {
        const socket = getGameSocket();
        if(socket) {
            socket.gameClosing = true;
            socket.close();
            setGameSocket(null);
        }
        return dispatch(gameSocketClosed());
    };
}
