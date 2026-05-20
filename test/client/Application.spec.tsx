import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

const loadCardsSpy = vi.fn();
const loadPacksSpy = vi.fn();
const loadFactionsSpy = vi.fn();
const loadFormatsSpy = vi.fn();
const receiveGameStateSpy = vi.fn();
const socketConnectedSpy = vi.fn();
const receiveBannerNoticeSpy = vi.fn();

vi.mock("../../client/actions", () => ({
    loadCards: () => () => loadCardsSpy(),
    loadPacks: () => () => loadPacksSpy(),
    loadFactions: () => () => loadFactionsSpy(),
    loadFormats: () => () => loadFormatsSpy(),
    receiveGameState: (...args: any[]) => () => receiveGameStateSpy(...args),
    socketConnected: () => () => socketConnectedSpy(),
    receiveBannerNotice: (...args: any[]) => () => receiveBannerNoticeSpy(...args),
    receiveGames: () => () => undefined,
    receiveUsers: () => () => undefined,
    receiveNewGame: () => () => undefined,
    clearGameState: () => () => undefined,
    receivePasswordError: () => () => undefined,
    onGameHandoffReceived: () => () => undefined,
    closeGameSocket: () => () => undefined,
    gameSocketConnecting: () => () => undefined,
    gameSocketDisconnect: () => () => undefined,
    gameSocketReconnecting: () => () => undefined,
    gameSocketConnected: () => () => undefined,
    sendGameSocketConnectFailed: () => () => undefined,
    setContextMenu: () => () => undefined
}));

const setLobbySocketSpy = vi.fn();
const setGameSocketSpy = vi.fn();
vi.mock("../../client/socket", () => ({
    setLobbySocket: (...args: any[]) => setLobbySocketSpy(...args),
    setGameSocket: (...args: any[]) => setGameSocketSpy(...args),
    getGameSocket: () => undefined
}));

interface FakeSocket {
    handlers: Record<string, (...args: any[]) => void>;
    on: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    io: { on: ReturnType<typeof vi.fn> };
    auth: { token?: string; version?: any };
}

const fakeSocket: FakeSocket = {
    handlers: {},
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    disconnect: vi.fn(),
    io: { on: vi.fn() },
    auth: {}
};

vi.mock("socket.io-client", () => ({
    io: vi.fn((_url: string, opts: any) => {
        fakeSocket.auth = opts.auth;
        return fakeSocket;
    })
}));

const axiosInterceptorUseSpy = vi.fn();
const axiosInterceptorEjectSpy = vi.fn();
vi.mock("axios", () => ({
    default: {
        interceptors: {
            response: {
                use: (...args: any[]) => {
                    axiosInterceptorUseSpy(...args);
                    return 42;
                },
                eject: (...args: any[]) => axiosInterceptorEjectSpy(...args)
            }
        }
    }
}));

vi.mock("../../client/hooks", () => ({
    useAppDispatch: () => (action: any) => (typeof action === "function" ? action() : action),
    useAppSelector: (selector: any) => selector({
        games: { games: [], currentGame: undefined, gameId: undefined },
        auth: { user: undefined, username: undefined, token: "tok-1", loggedIn: false }
    })
}));

// Lazy-loaded subcomponents — stub to lightweight placeholders so render doesn't suspend forever.
vi.mock("../../client/Login", () => ({ default: () => <div>Login</div> }));
vi.mock("../../client/Logout", () => ({ default: () => <div>Logout</div> }));
vi.mock("../../client/Register", () => ({ default: () => <div>Register</div> }));
vi.mock("../../client/Lobby", () => ({ default: () => <div>Lobby</div> }));
vi.mock("../../client/NotFound", () => ({ default: () => <div>NotFound</div> }));
vi.mock("../../client/SiteComponents/ErrorBoundary", () => ({ default: ({ children }: any) => <>{ children }</> }));
vi.mock("../../client/NavBar", () => ({ default: (props: any) => <nav data-testid="navbar" data-num={ props.numGames } /> }));
vi.mock("../../client/GameLobby", () => ({ default: () => <div>GameLobby</div> }));
vi.mock("../../client/GameBoard", () => ({ default: () => <div>GameBoard</div> }));
vi.mock("../../client/gameStateRecorder.js", () => ({
    startRecording: vi.fn(),
    recordState: vi.fn(),
    setHiddenInfo: vi.fn(),
    clearRecording: vi.fn()
}));

import Application from "../../client/Application";

function renderApp() {
    return render(<MemoryRouter><Application /></MemoryRouter>);
}

describe("<Application />", () => {
    beforeEach(() => {
        loadCardsSpy.mockReset();
        loadPacksSpy.mockReset();
        loadFactionsSpy.mockReset();
        loadFormatsSpy.mockReset();
        receiveGameStateSpy.mockReset();
        socketConnectedSpy.mockReset();
        receiveBannerNoticeSpy.mockReset();
        setLobbySocketSpy.mockReset();
        setGameSocketSpy.mockReset();
        axiosInterceptorUseSpy.mockReset();
        axiosInterceptorEjectSpy.mockReset();
        fakeSocket.on.mockReset();
        fakeSocket.removeAllListeners.mockReset();
        fakeSocket.disconnect.mockReset();
        fakeSocket.handlers = {};
        fakeSocket.on.mockImplementation((event: string, handler: (...args: any[]) => void) => {
            fakeSocket.handlers[event] = handler;
            return fakeSocket;
        });
    });

    it("dispatches loadCards/loadPacks/loadFactions/loadFormats on mount", () => {
        renderApp();
        expect(loadCardsSpy).toHaveBeenCalledOnce();
        expect(loadPacksSpy).toHaveBeenCalledOnce();
        expect(loadFactionsSpy).toHaveBeenCalledOnce();
        expect(loadFormatsSpy).toHaveBeenCalledOnce();
    });

    it("installs exactly one axios response interceptor on mount and ejects it on unmount", () => {
        const { unmount } = renderApp();
        expect(axiosInterceptorUseSpy).toHaveBeenCalledOnce();
        expect(axiosInterceptorEjectSpy).not.toHaveBeenCalled();
        unmount();
        expect(axiosInterceptorEjectSpy).toHaveBeenCalledExactlyOnceWith(42);
    });

    it("creates the lobby socket with the auth token from the store and registers it via setLobbySocket", () => {
        renderApp();
        expect(fakeSocket.auth.token).toBe("tok-1");
        expect(setLobbySocketSpy).toHaveBeenCalledExactlyOnceWith(fakeSocket);
    });

    it("clears the lobby socket and disconnects it on unmount", () => {
        const { unmount } = renderApp();
        setLobbySocketSpy.mockClear();
        unmount();
        expect(fakeSocket.removeAllListeners).toHaveBeenCalledOnce();
        expect(fakeSocket.disconnect).toHaveBeenCalledOnce();
        expect(setLobbySocketSpy).toHaveBeenCalledExactlyOnceWith(null);
    });

    it("routes the 'gamestate' socket event through receiveGameState with the current username", () => {
        renderApp();
        const gamestate = fakeSocket.handlers.gamestate;
        gamestate({ started: false, players: {} });
        expect(receiveGameStateSpy).toHaveBeenCalledOnce();
        expect(receiveGameStateSpy.mock.calls[0][0]).toEqual({ started: false, players: {} });
    });

    it("forwards the 'connect' socket event to socketConnected", () => {
        renderApp();
        fakeSocket.handlers.connect();
        expect(socketConnectedSpy).toHaveBeenCalledOnce();
    });

    it("forwards the 'banner' socket event to receiveBannerNotice", () => {
        renderApp();
        fakeSocket.handlers.banner("downtime tonight");
        expect(receiveBannerNoticeSpy).toHaveBeenCalledExactlyOnceWith("downtime tonight");
    });
});
