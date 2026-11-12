import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { leaveGame } from "../../client/ReduxActions/socket";
import { getGameSocket, setGameSocket, type GameSocket } from "../../client/socket";

// matches LEAVE_GAME_TIMEOUT in the action
const LEAVE_GAME_TIMEOUT = 2000;

function fakeSocket() {
    const listeners = new Map<string, () => void>();
    const socket = {
        emit: vi.fn(),
        close: vi.fn(),
        once: vi.fn((event: string, listener: () => void) => listeners.set(event, listener)),
        off: vi.fn((event: string) => listeners.delete(event)),
        gameClosing: false,
        receive: (event: string) => listeners.get(event)?.()
    };
    return socket;
}

describe("leaveGame", () => {
    let socket: ReturnType<typeof fakeSocket>;
    let dispatch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        socket = fakeSocket();
        setGameSocket(socket as unknown as GameSocket);
        dispatch = vi.fn();
    });

    afterEach(() => {
        setGameSocket(null);
        vi.useRealTimers();
    });

    it("sends leavegame and keeps the socket open until the node confirms", () => {
        leaveGame()(dispatch);

        expect(socket.emit).toHaveBeenCalledExactlyOnceWith("game", "leavegame");
        expect(socket.close).not.toHaveBeenCalled();

        socket.receive("cleargamestate");

        expect(socket.close).toHaveBeenCalledOnce();
        expect(socket.gameClosing).toBe(true);
        expect(getGameSocket()).toBeNull();
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringMatching(/gameSocketClosed$/) }));
    });

    it("closes the socket after the timeout when the node never confirms, and only once", () => {
        leaveGame()(dispatch);

        vi.advanceTimersByTime(LEAVE_GAME_TIMEOUT - 1);
        expect(socket.close).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        socket.receive("cleargamestate");

        expect(socket.close).toHaveBeenCalledOnce();
        expect(getGameSocket()).toBeNull();
    });

    it("leaves a socket from a newer handoff alone", () => {
        leaveGame()(dispatch);
        const newer = fakeSocket();
        setGameSocket(newer as unknown as GameSocket);

        socket.receive("cleargamestate");

        expect(socket.close).toHaveBeenCalledOnce();
        expect(getGameSocket()).toBe(newer);
        expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringMatching(/gameSocketClosed$/) }));
    });

    it("does nothing without a game socket", () => {
        setGameSocket(null);

        leaveGame()(dispatch);

        expect(dispatch).not.toHaveBeenCalled();
    });
});
