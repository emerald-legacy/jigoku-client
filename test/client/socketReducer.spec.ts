import { describe, it, expect } from "vitest";

import socketReducer from "../../client/reducers/socket";
import {
    socketMessageSent,
    gameSocketConnecting,
    gameSocketConnected,
    gameSocketConnectFailed,
    gameSocketClosed
} from "../../client/reducers/socket";

// state.socket.startRequested is what the pending game screen shows as "waiting on the lobby",
// so it has to be cleared by every way a start attempt can end.
describe("the socket reducer's start request tracking", () => {
    const requested = () => socketReducer({}, socketMessageSent("startgame"));

    it("should remember that a start was requested", () => {
        expect(requested().startRequested).toBe(true);
    });

    it("should ignore other outgoing messages", () => {
        expect(socketReducer({}, socketMessageSent("chat")).startRequested).toBeUndefined();
        expect(socketReducer({}, socketMessageSent("selectdeck")).startRequested).toBeUndefined();
    });

    it("should clear the request once the game socket starts connecting", () => {
        const state = socketReducer(requested(), gameSocketConnecting("node-1"));

        expect(state.startRequested).toBe(false);
        expect(state.gameConnecting).toBe(true);
        expect(state.gameHost).toBe("node-1");
    });

    it("should clear the request once the game socket is connected", () => {
        expect(socketReducer(requested(), gameSocketConnected()).startRequested).toBe(false);
    });

    it("should clear the request when the connection attempt fails", () => {
        const state = socketReducer(requested(), gameSocketConnectFailed());

        expect(state.startRequested).toBe(false);
        expect(state.gameConnecting).toBe(false);
        expect(state.gameHost).toBeUndefined();
    });

    it("should clear the request when the game socket closes", () => {
        expect(socketReducer(requested(), gameSocketClosed(undefined)).startRequested).toBe(false);
    });

    it("should clear the request after a failed attempt is retried and fails again", () => {
        let state = requested();
        state = socketReducer(state, gameSocketConnecting("node-1"));
        state = socketReducer(state, gameSocketConnectFailed());
        state = socketReducer(state, socketMessageSent("startgame"));
        expect(state.startRequested).toBe(true);

        state = socketReducer(state, gameSocketConnectFailed());
        expect(state.startRequested).toBe(false);
    });
});
