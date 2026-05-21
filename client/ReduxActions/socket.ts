import type { Dispatch } from "redux";
import { getLobbySocket, getGameSocket, setGameSocket } from "../socket";
import {
    socketConnected,
    socketDisconnected,
    gameSocketConnected,
    gameSocketConnecting,
    gameSocketConnectFailed,
    gameSocketClosed,
    socketMessageSent,
    gameSocketConnectError,
    gameSocketDisconnect,
    gameSocketReconnecting
} from "../reducers/socket";

export {
    socketConnected,
    socketDisconnected,
    gameSocketConnected,
    gameSocketConnecting,
    gameSocketConnectFailed,
    gameSocketClosed,
    socketMessageSent,
    gameSocketConnectError,
    gameSocketDisconnect,
    gameSocketReconnecting
};

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

export function sendGameSocketConnectFailed() {
    return (dispatch: Dispatch) => {
        const socket = getLobbySocket();
        if(socket) {
            socket.emit("connectfailed");
        }
        return dispatch(gameSocketConnectFailed());
    };
}

export function gameSocketClose() {
    return (dispatch: Dispatch) => {
        return dispatch(gameSocketClosed(undefined));
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
        return dispatch(gameSocketClosed(undefined));
    };
}
