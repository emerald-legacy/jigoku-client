import React, { useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { bindActionCreators } from "@reduxjs/toolkit";
import { shallowEqual, useSelector } from "react-redux";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { setLobbySocket, setGameSocket, getGameSocket } from "./socket";
import type { GameSocket } from "./socket";

import type { RootState } from "./types/redux";
import type { GameState } from "./types/game";
import type { User } from "./types/user";
import { backgroundClassByValue } from "./backgrounds";

import Login from "./Login";
import Logout from "./Logout";
import Register from "./Register";
import Lobby from "./Lobby";
import NotFound from "./NotFound";
import ErrorBoundary from "./SiteComponents/ErrorBoundary";
import NavBar from "./NavBar";
import GameLobby from "./GameLobby";
import GameBoard from "./GameBoard";

const Decks = React.lazy(() => import("./Decks"));
const AddDeck = React.lazy(() => import("./AddDeck"));
const EditDeck = React.lazy(() => import("./EditDeck"));
const HowToPlay = React.lazy(() => import("./HowToPlay"));
const About = React.lazy(() => import("./About"));
const Community = React.lazy(() => import("./Community"));
const Formats = React.lazy(() => import("./Formats"));
const ForgotPassword = React.lazy(() => import("./ForgotPassword"));
const ResetPassword = React.lazy(() => import("./ResetPassword"));
const Profile = React.lazy(() => import("./Profile"));
const NewsAdmin = React.lazy(() => import("./NewsAdmin"));
const Unauthorised = React.lazy(() => import("./Unauthorised"));
const UserAdmin = React.lazy(() => import("./UserAdmin"));
const BlockList = React.lazy(() => import("./BlockList"));
const GameReplay = React.lazy(() => import("./GameReplay"));
import { startRecording, recordState, setHiddenInfo, clearRecording } from "./gameStateRecorder.js";

import { toast } from "sonner";

import version from "../version.js";

import * as actions from "./actions";
import { useAppDispatch, useAppSelector } from "./hooks";

function PlayRoute() {
    const currentGame = useSelector((state: RootState) => state.games.currentGame);
    if(currentGame && currentGame.started) {
        return <GameBoard />;
    }
    return <GameLobby />;
}

function NewsRoute({ canEdit }: { canEdit: boolean }) {
    return canEdit ? <NewsAdmin /> : <Unauthorised />;
}

function UsersRoute({ canManage }: { canManage: boolean }) {
    return canManage ? <UserAdmin /> : <Unauthorised />;
}

function AppRoutes({ permissions }: { permissions: Record<string, boolean> }) {
    return (
        <Routes>
            <Route path="/" element={ <Lobby /> } />
            <Route path="/login" element={ <Login /> } />
            <Route path="/logout" element={ <Logout /> } />
            <Route path="/register" element={ <Register /> } />
            <Route path="/decks" element={ <Decks /> } />
            <Route path="/decks/add" element={ <AddDeck /> } />
            <Route path="/decks/edit" element={ <EditDeck /> } />
            <Route path="/decks/edit/:deckId" element={ <EditDeck /> } />
            <Route path="/play" element={ <PlayRoute /> } />
            <Route path="/how-to-play" element={ <HowToPlay /> } />
            <Route path="/about" element={ <About /> } />
            <Route path="/community" element={ <Community /> } />
            <Route path="/formats" element={ <Formats /> } />
            <Route path="/forgot" element={ <ForgotPassword /> } />
            <Route path="/reset-password" element={ <ResetPassword /> } />
            <Route path="/profile" element={ <Profile /> } />
            <Route path="/news" element={ <NewsRoute canEdit={ !!permissions.canEditNews } /> } />
            <Route path="/unauth" element={ <Unauthorised /> } />
            <Route path="/users" element={ <UsersRoute canManage={ !!permissions.canManageUsers } /> } />
            <Route path="/blocklist" element={ <BlockList /> } />
            <Route path="/replay" element={ <GameReplay /> } />
            <Route path="*" element={ <NotFound /> } />
        </Routes>
    );
}

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

interface SocketHandlerState {
    username?: string;
    currentGameId?: string;
    token?: string;
    boundActions: ReturnType<typeof bindActionCreators<typeof actions, ReturnType<typeof useAppDispatch>>>;
}

export default function Application() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
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
                version: version
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

        socket.on("games", games => {
            stateRef.current.boundActions.receiveGames(games);
        });

        socket.on("users", users => {
            stateRef.current.boundActions.receiveUsers(users);
        });

        socket.on("newgame", game => {
            stateRef.current.boundActions.receiveNewGame(game);
        });

        socket.on("gamestate", game => {
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

        socket.on("passworderror", message => {
            stateRef.current.boundActions.receivePasswordError(message);
        });

        socket.on("handoff", server => {
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

            gameSocket.io.on("reconnect_attempt", (attemptNumber) => {
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

            gameSocket.on("gamestate", game => {
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

            gameSocket.on("hiddeninfo", data => {
                setHiddenInfo(data);
            });

            gameSocket.on("cleargamestate", () => {
                clearRecording();
                stateRef.current.boundActions.clearGameState();
            });
        });

        socket.on("banner", notice => {
            stateRef.current.boundActions.receiveBannerNotice(notice);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            setLobbySocket(null);
            axios.interceptors.response.eject(axiosInterceptor);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only setup; stateRef + navigateRef carry the always-current values that handlers need
    }, []);

    const prevCurrentGameRef = useRef<GameState | undefined>(undefined);
    useEffect(() => {
        if(prevCurrentGameRef.current && !currentGame) {
            boundActions.setContextMenu([]);
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
                { name: "Community", path: "/community" },
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
