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
        },
        gameSocketConnecting(state, action: PayloadAction<string>) {
            state.gameConnecting = true;
            state.gameHost = action.payload;
        },
        gameSocketConnectFailed(state) {
            state.gameConnecting = false;
            state.gameHost = undefined;
        },
        gameSocketClosed(state, _action: PayloadAction<string | undefined>) {
            state.gameConnected = false;
            state.gameConnecting = false;
            state.gameHost = undefined;
        },
        socketMessageSent(_state, _action: PayloadAction<string>) {
            // no-op; emitted for devtools traceability
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
