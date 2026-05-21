import React, { useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { bindActionCreators, type ActionCreatorsMapObject } from "@reduxjs/toolkit";
import { shallowEqual } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { setLobbySocket, setGameSocket, getGameSocket } from "./socket";
import type { GameSocket } from "./socket";

import type { RootState, PendingGameInfo } from "./types/redux";
import type { GameState, OnlineUser } from "./types/game";
import type { User } from "./types/user";
import type { HiddenInfo } from "./gameStateRecorder";

interface HandoffServer {
    protocol?: string;
    address: string;
    port?: number;
    name: string;
    gameId?: string;
}
import { backgroundClassByValue } from "./backgrounds";

import ErrorBoundary from "./SiteComponents/ErrorBoundary";
import NavBar from "./NavBar";
import AppRoutes from "./AppRoutes";
import { startRecording, recordState, setHiddenInfo, clearRecording } from "./gameStateRecorder";

import { toast } from "sonner";


import * as actions from "./actions";
import { useAppDispatch, useAppSelector } from "./hooks";

function mapStateToProps(state: RootState) {
    return {
        currentGame: state.games.currentGame,
        currentGameId: state.games.gameId,
        games: state.games.games,
        loggedIn: state.auth.loggedIn,
        token: state.auth.token,
        user: state.auth.user,
        username: state.auth.username
    };
}

function computeBackgroundClass(gameBoardVisible: boolean, user?: User): string {
    if(!gameBoardVisible || !user) {
        return "bg";
    }
    const background = user.settings.background;
    return (background && backgroundClassByValue[background]) || "bg-board-default";
}

interface BoundActions {
    loadCards: () => void;
    loadPacks: () => void;
    loadFactions: () => void;
    loadFormats: () => void;
    socketConnected: () => void;
    receiveGames: (games: PendingGameInfo[]) => void;
    receiveUsers: (users: OnlineUser[]) => void;
    receiveNewGame: (game: GameState) => void;
    receiveGameState: (game: GameState, username: string | undefined) => void;
    clearGameState: () => void;
    receivePasswordError: (message: string) => void;
    onGameHandoffReceived: (server: HandoffServer) => void;
    closeGameSocket: () => void;
    gameSocketConnecting: (url: string) => void;
    gameSocketDisconnect: () => void;
    gameSocketReconnecting: (attemptNumber: number) => void;
    gameSocketConnected: () => void;
    sendGameSocketConnectFailed: () => void;
    receiveBannerNotice: (notice: string) => void;
    setContextMenu: (menu: { x: number; y: number; menuId?: string } | undefined) => void;
}

interface SocketHandlerState {
    username?: string;
    currentGameId?: string;
    token?: string;
    boundActions: BoundActions;
}

export default function Application() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const boundActions = useMemo<BoundActions>(() => {
        // bindActionCreators returns specifically-typed dispatchers; we narrow to BoundActions
        // since each handler in BoundActions is compatible with its corresponding dispatcher
        // at runtime even though TS cannot verify this statically.
        return bindActionCreators(actions as ActionCreatorsMapObject, dispatch) as unknown as BoundActions;
    }, [dispatch]);
    const { currentGame, currentGameId, games, token, user, username } = useAppSelector(mapStateToProps, shallowEqual);

    const stateRef = useRef<SocketHandlerState>({ username, currentGameId, token, boundActions });
    useEffect(() => {
        stateRef.current = { username, currentGameId, token, boundActions };
    });

    const navigateRef = useRef(navigate);
    useEffect(() => {
        navigateRef.current = navigate;
    });

    useEffect(() => {
        const { boundActions: initialActions, token: initialToken } = stateRef.current;
        initialActions.loadCards();
        initialActions.loadPacks();
        initialActions.loadFactions();
        initialActions.loadFormats();

        const axiosInterceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if(error.response) {
                    if(error.response.status === 401) {
                        navigateRef.current("/login");
                    } else if(error.response.status === 403) {
                        navigateRef.current("/unauth");
                    }
                }
                return Promise.reject(error);
            }
        );

        const socket = io(window.location.origin, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            auth: {
                token: initialToken,
                version: __BUILD_VERSION__
            }
        });
        setLobbySocket(socket);

        socket.on("connect", () => {
            stateRef.current.boundActions.socketConnected();
        });

        socket.on("disconnect", () => {
            toast.error("You have been disconnected from the lobby server, attempting reconnect..", { description: "Connection lost" });
        });

        socket.on("reconnect", () => {
            toast.success("The reconnection to the lobby has been successful", { description: "Reconnected" });
            stateRef.current.boundActions.socketConnected();
        });

        socket.on("games", (games: PendingGameInfo[]) => {
            stateRef.current.boundActions.receiveGames(games);
        });

        socket.on("users", (users: OnlineUser[]) => {
            stateRef.current.boundActions.receiveUsers(users);
        });

        socket.on("newgame", (game: GameState) => {
            stateRef.current.boundActions.receiveNewGame(game);
        });

        socket.on("gamestate", (game: GameState) => {
            const { username: liveUsername, boundActions: liveActions } = stateRef.current;
            if(game.started && game.players?.[liveUsername || ""]) {
                recordState(game);
            }
            liveActions.receiveGameState(game, liveUsername);
        });

        socket.on("cleargamestate", () => {
            clearRecording();
            stateRef.current.boundActions.clearGameState();
        });

        socket.on("passworderror", (message: string) => {
            stateRef.current.boundActions.receivePasswordError(message);
        });

        socket.on("handoff", (server: HandoffServer) => {
            clearRecording();
            let url = `${server.protocol || "https"}://${server.address}`;
            if(server.port && server.port !== 80 && server.port !== 443) {
                url += `:${server.port}`;
            }

            const { currentGameId: liveGameId, token: liveToken, boundActions: liveActions } = stateRef.current;
            liveActions.onGameHandoffReceived(server);

            if(getGameSocket() && liveGameId !== server.gameId) {
                liveActions.closeGameSocket();
            }

            liveActions.gameSocketConnecting(`${url}/${server.name}`);

            const gameSocket: GameSocket = io(url, {
                path: `/${server.name}/socket.io`,
                reconnection: true,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                reconnectionAttempts: 20,
                auth: {
                    token: liveToken
                }
            });
            setGameSocket(gameSocket);

            gameSocket.on("connect_error", (err: Error & { description?: string }) => {
                toast.error(`There was an error connecting to the game server: ${err.message}(${err.description})`, { description: "Connect Error" });
            });

            gameSocket.on("disconnect", () => {
                if(!gameSocket.gameClosing) {
                    toast.error("You have been disconnected from the game server", { description: "Connection lost" });
                }
                stateRef.current.boundActions.gameSocketDisconnect();
            });

            gameSocket.io.on("reconnect_attempt", (attemptNumber: number) => {
                toast.info(`Attempt number ${attemptNumber} to reconnect..`, { description: "Reconnecting" });
                stateRef.current.boundActions.gameSocketReconnecting(attemptNumber);
            });

            gameSocket.on("reconnect", () => {
                toast.success("The reconnection has been successful", { description: "Reconnected" });
                stateRef.current.boundActions.gameSocketConnected();
            });

            gameSocket.on("reconnect_failed", () => {
                toast.error("Given up trying to connect to the server", { description: "Reconnect failed" });
                stateRef.current.boundActions.sendGameSocketConnectFailed();
            });

            gameSocket.on("connect", () => {
                stateRef.current.boundActions.gameSocketConnected();
            });

            gameSocket.on("gamestate", (game: GameState) => {
                const { username: liveUsername, boundActions: gameActions } = stateRef.current;
                const isPlayer = !!game.players?.[liveUsername || ""];
                if(isPlayer && game.started && !game.winner) {
                    startRecording();
                }
                if(isPlayer) {
                    recordState(game);
                }
                gameActions.receiveGameState(game, liveUsername);
            });

            gameSocket.on("hiddeninfo", (data: HiddenInfo[]) => {
                setHiddenInfo(data);
            });

            gameSocket.on("cleargamestate", () => {
                clearRecording();
                stateRef.current.boundActions.clearGameState();
            });
        });

        socket.on("banner", (notice: string) => {
            stateRef.current.boundActions.receiveBannerNotice(notice);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            setLobbySocket(null);
            axios.interceptors.response.eject(axiosInterceptor);
        };

    }, []);

    const prevCurrentGameRef = useRef<GameState | undefined>(undefined);
    useEffect(() => {
        if(prevCurrentGameRef.current && !currentGame) {
            boundActions.setContextMenu(undefined);
        }
        prevCurrentGameRef.current = currentGame;
    }, [currentGame, boundActions]);

    let rightMenu;
    if(!user) {
        rightMenu = [
            { name: "Login", path: "/login" },
            { name: "Register", path: "/register" }
        ];
    } else {
        rightMenu = [
            {
                name: user.username,
                childItems: [
                    { name: "Profile", path: "/profile" },
                    { name: "Block List", path: "/blocklist" },
                    { name: "Logout", path: "/logout" }
                ],
                avatar: true,
                emailHash: user.emailHash,
                disableGravatar: user.settings.disableGravatar
            }
        ];
    }

    const leftMenu = [
        { name: "Decks", path: "/decks" },
        { name: "Play", path: "/play" },
        { name: "Replay", path: "/replay" },
        {
            name: "Help", childItems: [
                { name: "How To Play", path: "/how-to-play" },
                { name: "About", path: "/about" },
                { name: "Formats", path: "/formats" }
            ]
        }
    ];

    const adminMenuItems: { name: string; path: string }[] = [];
    let permissions: Record<string, boolean> = {};

    if(user && user.permissions) {
        permissions = user.permissions;

        if(permissions.canEditNews) {
            adminMenuItems.push({ name: "News", path: "/news" });
        }

        if(permissions.canManageUsers) {
            adminMenuItems.push({ name: "Users", path: "/users" });
        }
    }

    if(adminMenuItems.length > 0) {
        leftMenu.push({ name: "Admin", childItems: adminMenuItems });
    }

    const gameBoardVisible = location.pathname === "/play" && !!currentGame && !!currentGame.started;
    const backgroundClass = computeBackgroundClass(gameBoardVisible, user);

    return (
        <div className={ backgroundClass }>
            <NavBar leftMenu={ leftMenu } rightMenu={ rightMenu } title="Jigoku Online" numGames={ games.length } />
            <div className="container">
                <ErrorBoundary navigate={ navigate } errorPath={ location.pathname } message={ "We're sorry - something's gone wrong." }>
                    <React.Suspense fallback={ null }>
                        <AppRoutes permissions={ permissions } />
                    </React.Suspense>
                </ErrorBoundary>
            </div>
        </div>
    );
}
