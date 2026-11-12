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

export function sendSocketMessage(message: string, ...args: unknown[]) {
    return (dispatch: Dispatch) => {
        const socket = getLobbySocket();
        if(socket) {
            socket.emit(message, ...args);
        }
        return dispatch(socketMessageSent(message));
    };
}

export function sendGameMessage(message: string, ...args: unknown[]) {
    return (dispatch: Dispatch) => {
        const socket = getGameSocket();
        if(socket) {
            socket.emit("game", message, ...args);
        }
        return dispatch(socketMessageSent(message));
    };
}

/** How long leaveGame waits for the game node to confirm before it closes the socket anyway. */
const LEAVE_GAME_TIMEOUT = 2000;

/**
 * Leaves the game, and closes the game socket once the node confirms with cleargamestate (or after a timeout).
 * Closing at once would lose leavegame: socket.io drops an event that arrives together with the disconnect.
 */
export function leaveGame() {
    return (dispatch: Dispatch) => {
        const socket = getGameSocket();
        if(!socket) {
            return;
        }

        let closed = false;
        const close = () => {
            if(closed) {
                return;
            }
            closed = true;
            clearTimeout(timer);
            socket.off("cleargamestate", close);
            socket.gameClosing = true;
            socket.close();
            // a handoff to another game may have replaced the socket meanwhile
            if(getGameSocket() === socket) {
                setGameSocket(null);
                dispatch(gameSocketClosed(undefined));
            }
        };
        const timer = setTimeout(close, LEAVE_GAME_TIMEOUT);
        socket.once("cleargamestate", close);

        socket.emit("game", "leavegame");
        dispatch(socketMessageSent("leavegame"));
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
