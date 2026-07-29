import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SocketState } from "../types/redux";

const socketSlice = createSlice({
    name: "socket",
    initialState: {} as SocketState,
    reducers: {
        socketConnected(state) {
            state.connected = true;
        },
        socketDisconnected(state) {
            state.connected = false;
        },
        gameSocketConnected(state) {
            state.gameConnected = true;
            state.gameConnecting = false;
            state.startRequested = false;
        },
        gameSocketConnecting(state, action: PayloadAction<string>) {
            state.gameConnecting = true;
            state.gameHost = action.payload;
            state.startRequested = false;
        },
        gameSocketConnectFailed(state) {
            state.gameConnecting = false;
            state.gameHost = undefined;
            state.startRequested = false;
        },
        gameSocketClosed(state, _action: PayloadAction<string | undefined>) {
            state.gameConnected = false;
            state.gameConnecting = false;
            state.gameHost = undefined;
            state.startRequested = false;
        },
        socketMessageSent(state, action: PayloadAction<string>) {
            // Otherwise only emitted for devtools traceability; a start request is worth
            // remembering so the pending game can say it is waiting on the lobby.
            if(action.payload === "startgame") {
                state.startRequested = true;
            }
        },
        gameSocketConnectError(_state) {
            // no-op; emitted for devtools traceability
        },
        gameSocketDisconnect(_state) {
            // no-op; emitted for devtools traceability
        },
        gameSocketReconnecting(_state, _action: PayloadAction<number | undefined>) {
            // no-op; emitted for devtools traceability
        }
    }
});

export const {
    socketConnected, socketDisconnected,
    gameSocketConnected, gameSocketConnecting, gameSocketConnectFailed,
    gameSocketClosed, socketMessageSent, gameSocketConnectError,
    gameSocketDisconnect, gameSocketReconnecting
} = socketSlice.actions;

export default socketSlice.reducer;
