import React from "react";
import axios from "axios";
import { bindActionCreators } from "@reduxjs/toolkit";
import type { Dispatch } from "@reduxjs/toolkit";
import { connect, useSelector } from "react-redux";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { setLobbySocket, setGameSocket, getGameSocket } from "./socket";
import type { GameSocket } from "./socket";

import type { RootState } from "./types/redux";
import type { GameState } from "./types/game";
import type { User } from "./types/user";

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

type ActionFn = (...args: any[]) => any;

interface AppStateProps {
    currentGame?: GameState;
    currentGameId?: string;
    games: any[];
    loggedIn?: boolean;
    token?: string;
    user?: User;
    username?: string;
}

interface AppDispatchProps {
    dispatch: Dispatch;
    loadCards: ActionFn;
    loadPacks: ActionFn;
    loadFactions: ActionFn;
    loadFormats: ActionFn;
    socketConnected: ActionFn;
    receiveGames: ActionFn;
    receiveUsers: ActionFn;
    receiveNewGame: ActionFn;
    receiveGameState: ActionFn;
    clearGameState: ActionFn;
    receivePasswordError: ActionFn;
    receiveBannerNotice: ActionFn;
    onGameHandoffReceived: ActionFn;
    closeGameSocket: ActionFn;
    gameSocketConnecting: ActionFn;
    gameSocketDisconnect: ActionFn;
    gameSocketReconnecting: ActionFn;
    gameSocketConnected: ActionFn;
    sendGameSocketConnectFailed: ActionFn;
    setContextMenu: ActionFn;
}

interface AppRouterProps {
    pathname: string;
    navigate: NavigateFunction;
}

type AppProps = AppStateProps & AppDispatchProps & AppRouterProps;

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

class App extends React.Component<AppProps> {
    static displayName = "Application";

    componentDidMount() {
        this.props.loadCards();
        this.props.loadPacks();
        this.props.loadFactions();
        this.props.loadFormats();

        this.axiosInterceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if(error.response) {
                    if(error.response.status === 401) {
                        this.props.navigate("/login");
                    } else if(error.response.status === 403) {
                        this.props.navigate("/unauth");
                    }
                }
                return Promise.reject(error);
            }
        );

        let socket = io(window.location.origin, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            auth: {
                token: this.props.token,
                version: version
            }
        });

        this.lobbySocket = socket;
        setLobbySocket(socket);

        socket.on("connect", () => {
            this.props.socketConnected();
        });

        socket.on("disconnect", () => {
            toast.error("You have been disconnected from the lobby server, attempting reconnect..", { description: "Connection lost" });
        });

        socket.on("reconnect", () => {
            toast.success("The reconnection to the lobby has been successful", { description: "Reconnected" });
            this.props.socketConnected();
        });

        socket.on("games", games => {
            this.props.receiveGames(games);
        });

        socket.on("users", users => {
            this.props.receiveUsers(users);
        });

        socket.on("newgame", game => {
            this.props.receiveNewGame(game);
        });

        socket.on("gamestate", game => {
            if(game.started && game.players?.[this.props.username]) {
                recordState(game);
            }
            this.props.receiveGameState(game, this.props.username);
        });

        socket.on("cleargamestate", () => {
            clearRecording();
            this.props.clearGameState();
        });

        socket.on("passworderror", message => {
            this.props.receivePasswordError(message);
        });

        socket.on("handoff", server => {
            clearRecording();
            let url = `${server.protocol || "https"}://${server.address}`;
            if(server.port && server.port !== 80 && server.port !== 443) {
                url += `:${server.port}`;
            }

            this.props.onGameHandoffReceived(server);

            if(getGameSocket() && this.props.currentGameId !== server.gameId) {
                this.props.closeGameSocket();
            }

            this.props.gameSocketConnecting(`${url}/${server.name}`);

            let gameSocket: GameSocket = io(url, {
                path: `/${server.name}/socket.io`,
                reconnection: true,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                reconnectionAttempts: 20,
                auth: {
                    token: this.props.token
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

                this.props.gameSocketDisconnect();
            });

            gameSocket.io.on("reconnect_attempt", (attemptNumber) => {
                toast.info(`Attempt number ${attemptNumber} to reconnect..`, { description: "Reconnecting" });

                this.props.gameSocketReconnecting(attemptNumber);
            });

            gameSocket.on("reconnect", () => {
                toast.success("The reconnection has been successful", { description: "Reconnected" });
                this.props.gameSocketConnected();
            });

            gameSocket.on("reconnect_failed", () => {
                toast.error("Given up trying to connect to the server", { description: "Reconnect failed" });
                this.props.sendGameSocketConnectFailed();
            });

            gameSocket.on("connect", () => {
                this.props.gameSocketConnected();
            });

            gameSocket.on("gamestate", game => {
                const isPlayer = !!game.players?.[this.props.username];
                if(isPlayer && game.started && !game.winner) {
                    startRecording();
                }
                if(isPlayer) {
                    recordState(game);
                }
                this.props.receiveGameState(game, this.props.username);
            });

            gameSocket.on("hiddeninfo", data => {
                setHiddenInfo(data);
            });

            gameSocket.on("cleargamestate", () => {
                clearRecording();
                this.props.clearGameState();
            });
        });

        socket.on("banner", notice => {
            this.props.receiveBannerNotice(notice);
        });
    }

    componentDidUpdate(prevProps: AppProps) {
        if(prevProps.currentGame && !this.props.currentGame) {
            this.props.setContextMenu([]);
        }
    }

    componentWillUnmount() {
        if(this.lobbySocket) {
            this.lobbySocket.removeAllListeners();
            this.lobbySocket.disconnect();
            setLobbySocket(null);
        }
        if(this.axiosInterceptor !== undefined) {
            axios.interceptors.response.eject(this.axiosInterceptor);
        }
    }

    private axiosInterceptor?: number;
    private lobbySocket?: Socket;

    render() {
        let rightMenu;

        if(!this.props.user) {
            rightMenu = [
                { name: "Login", path: "/login" },
                { name: "Register", path: "/register" }
            ];
        } else {
            rightMenu = [
                {
                    name: this.props.user.username, childItems: [
                        { name: "Profile", path: "/profile" },
                        { name: "Block List", path: "/blocklist" },
                        { name: "Logout", path: "/logout" }
                    ], avatar: true, emailHash: this.props.user.emailHash, disableGravatar: this.props.user.settings.disableGravatar
                }
            ];
        }

        let leftMenu = [
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

        let adminMenuItems: { name: string; path: string }[] = [];
        let permissions: Record<string, boolean> = {};

        if(this.props.user && this.props.user.permissions) {
            permissions = this.props.user.permissions;

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

        const gameBoardVisible = this.props.pathname === "/play" && !!this.props.currentGame && !!this.props.currentGame.started;
        const backgroundClass = computeBackgroundClass(gameBoardVisible, this.props.user);

        return (<div className={ backgroundClass }>
            <NavBar leftMenu={ leftMenu } rightMenu={ rightMenu } title="Jigoku Online" numGames={ this.props.games.length } />
            <div className="container">
                <ErrorBoundary navigate={ this.props.navigate } errorPath={ this.props.pathname } message={ "We're sorry - something's gone wrong." }>
                    <React.Suspense fallback={ null }>
                        <AppRoutes permissions={ permissions } />
                    </React.Suspense>
                </ErrorBoundary>
            </div>
        </div>);
    }
}

const backgroundClassByBackground: Record<string, string> = {
    CRAB: "bg-board-crab",
    CRANE: "bg-board-crane",
    DRAGON: "bg-board-dragon",
    LION: "bg-board-lion",
    PHOENIX: "bg-board-phoenix",
    SCORPION: "bg-board-scorpion",
    UNICORN: "bg-board-unicorn",
    CRAB2: "bg-board-crab2",
    CRAB3: "bg-board-crab3",
    CRANE2: "bg-board-crane2",
    CRANE3: "bg-board-crane3",
    CRANE4: "bg-board-crane4",
    DRAGON2: "bg-board-dragon2",
    DRAGON3: "bg-board-dragon3",
    LION2: "bg-board-lion2",
    LION3: "bg-board-lion3",
    PHOENIX2: "bg-board-phoenix2",
    PHOENIX3: "bg-board-phoenix3",
    SCORPION2: "bg-board-scorpion2",
    SCORPION3: "bg-board-scorpion3",
    UNICORN2: "bg-board-unicorn2",
    UNICORN3: "bg-board-unicorn3",
    OTTER: "bg-board-otter"
};

function computeBackgroundClass(gameBoardVisible: boolean, user?: User): string {
    if(!gameBoardVisible || !user) {
        return "bg";
    }
    const background = user.settings.background;
    return (background && backgroundClassByBackground[background]) || "bg-board-default";
}

function mapStateToProps(state: RootState): AppStateProps {
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

function mapDispatchToProps(dispatch: Dispatch): AppDispatchProps {
    const boundActions = bindActionCreators(actions as unknown as Record<string, ActionFn>, dispatch);
    return { ...(boundActions as Omit<AppDispatchProps, "dispatch">), dispatch };
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);

export default function Application() {
    const location = useLocation();
    const navigate = useNavigate();
    return <ConnectedApp pathname={ location.pathname } navigate={ navigate } />;
}
