export function socketConnected(socket: any) {
    return {
        type: "SOCKET_CONNECTED" as const,
        socket: socket
    };
}

export function socketMessageSent(message: string) {
    return {
        type: "SOCKET_MESSAGE_SENT" as const,
        message: message
    };
}

export function sendSocketMessage(message: string, ...args: any[]) {
    return (dispatch: any, getState: any) => {
        var state = getState();

        state.socket.socket.emit(message, ...args);

        return dispatch(socketMessageSent(message));
    };
}

export function sendGameMessage(message: string, ...args: any[]) {
    return (dispatch: any, getState: any) => {
        var state = getState();

        if(state.socket.gameSocket) {
            state.socket.gameSocket.emit("game", message, ...args);
        }

        return dispatch(socketMessageSent(message));
    };
}

export function gameSocketConnected(socket: any) {
    return {
        type: "GAME_SOCKET_CONNECTED" as const,
        socket: socket
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

export function gameSocketReconnecting() {
    return {
        type: "GAME_SOCKET_RECONNECTED" as const
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
    return (dispatch: any, getState: any) => {
        var state = getState();

        if(state.socket.socket) {
            state.socket.socket.emit("connectfailed");
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
    return (dispatch: any) => {
        return dispatch(gameSocketClosed());
    };
}

export function closeGameSocket() {
    return (dispatch: any, getState: any) => {
        var state = getState();

        if(state.socket.gameSocket) {
            state.socket.gameSocket.gameClosing = true;
            state.socket.gameSocket.close();
        }

        return dispatch(gameSocketClosed());
    };
}
