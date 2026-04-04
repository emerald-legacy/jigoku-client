import React from "react";
import axios from "axios";
import { bindActionCreators } from "@reduxjs/toolkit";
import { connect } from "react-redux";
import { io } from "socket.io-client";

import Login from './Login.jsx';
import Logout from './Logout.jsx';
import Register from './Register.jsx';
import Lobby from './Lobby.jsx';
import Decks from './Decks.jsx';
import AddDeck from './AddDeck.jsx';
import EditDeck from './EditDeck.jsx';
import NotFound from './NotFound.jsx';
import ErrorBoundary from './SiteComponents/ErrorBoundary.jsx';
import NavBar from './NavBar.jsx';
import GameLobby from './GameLobby.jsx';
import GameBoard from './GameBoard.jsx';
import HowToPlay from './HowToPlay.jsx';
import About from './About.jsx';
import Community from './Community.jsx';
import Formats from './Formats.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import Profile from './Profile.jsx';
import NewsAdmin from './NewsAdmin.jsx';
import Unauthorised from './Unauthorised.jsx';
import UserAdmin from './UserAdmin.jsx';
import BlockList from './BlockList.jsx';
import GameReplay from './GameReplay.jsx';
import { startRecording, recordState, setHiddenInfo, clearRecording } from './gameStateRecorder.js';

import { toast } from "sonner";

import version from "../version.js";

import * as actions from "./actions";

class App extends React.Component {
    constructor(props) {
        super(props);

        let boundActionCreators = bindActionCreators(actions, this.props.dispatch);

        this.paths = {
            "/": () => <Lobby />,
            "/login": () => <Login />,
            "/register": () => <Register />,
            "/decks": () => <Decks { ...boundActionCreators } />,
            "/decks/add": () => <AddDeck />,
            "/decks/edit": params => <EditDeck deckId={ params.deckId } />,
            "/play": () => (this.props.currentGame && this.props.currentGame.started) ? <GameBoard /> : <GameLobby />,
            "/how-to-play": () => <HowToPlay />,
            "/about": () => <About />,
            "/community": () => <Community />,
            "/formats": () => <Formats />,
            "/forgot": () => <ForgotPassword />,
            "/reset-password": params => <ResetPassword id={ params.id } token={ params.token } />,
            "/profile": () => <Profile />,
            "/news": () => <NewsAdmin />
        };
    }

    componentDidMount() {
        this.props.loadCards();
        this.props.loadPacks();
        this.props.loadFactions();
        this.props.loadFormats();

        // Set up axios interceptor for global error handling (replaces jQuery ajaxError)
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

        socket.on("connect", () => {
            this.props.socketConnected(socket);
        });

        socket.on("disconnect", () => {
            toast.error("You have been disconnected from the lobby server, attempting reconnect..", { description: "Connection lost" });
        });

        socket.on("reconnect", () => {
            toast.success("The reconnection to the lobby has been successful", { description: "Reconnected" });
            this.props.socketConnected(socket);
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
            if(game.started) {
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
            let url = `${server.protocol || "https"}://${server.address}`;
            if(server.port && server.port !== 80 && server.port !== 443) {
                url += `:${server.port}`;
            }

            this.props.onGameHandoffReceived(server);

            if(this.props.gameSocket && this.props.currentGameId !== server.gameId) {
                this.props.closeGameSocket();
            }

            this.props.gameSocketConnecting(`${url}/${server.name}`);

            let gameSocket = io(url, {
                path: `/${server.name}/socket.io`,
                reconnection: true,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                reconnectionAttempts: 20,
                auth: {
                    token: this.props.token
                }
            });

            gameSocket.on("connect_error", (err) => {
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
                this.props.gameSocketConnected(gameSocket);
            });

            gameSocket.on("reconnect_failed", () => {
                toast.error("Given up trying to connect to the server", { description: "Reconnect failed" });
                this.props.sendGameSocketConnectFailed();
            });

            gameSocket.on("connect", () => {
                this.props.gameSocketConnected(gameSocket);
            });

            gameSocket.on("gamestate", game => {
                if(game.started && !game.winner) {
                    startRecording();
                }
                recordState(game);
                this.props.receiveGameState(game, this.props.username);
            });

            gameSocket.on('hiddeninfo', data => {
                setHiddenInfo(data);
            });

            gameSocket.on('cleargamestate', () => {
                clearRecording();
                this.props.clearGameState();
            });
        });

        socket.on("banner", notice => {
            this.props.receiveBannerNotice(notice);
        });
    }

    componentDidUpdate(prevProps) {
        if(prevProps.currentGame && !this.props.currentGame) {
            this.props.setContextMenu([]);
        }
    }

    componentWillUnmount() {
        if(this.lobbySocket) {
            this.lobbySocket.removeAllListeners();
            this.lobbySocket.disconnect();
        }
        // Clean up axios interceptor
        if(this.axiosInterceptor !== undefined) {
            axios.interceptors.response.eject(this.axiosInterceptor);
        }
    }

    getUrlParameter(name) {
        name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
        let regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
        let results = regex.exec(location.search);

        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

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

        let adminMenuItems = [];
        let permissions = {};

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

        let component = {};

        let path = this.props.path;
        let argIndex = path.lastIndexOf("/");
        let arg;

        let page = this.paths[path];
        if(!page) {
            if(argIndex !== -1 && argIndex !== 0) {
                arg = path.substring(argIndex + 1);
                path = path.substring(0, argIndex);
            }

            let page = this.paths[path];
            if(!page) {
                page = this.paths[this.props.path];
                arg = undefined;
            }
        }

        let idArg;
        let tokenArg;
        let index;
        let gameBoardVisible = false;

        index = path.indexOf("/reset-password");
        if(index !== -1) {
            idArg = this.getUrlParameter("id");
            tokenArg = this.getUrlParameter("token");
        }

        let boundActionCreators = bindActionCreators(actions, this.props.dispatch);

        switch(path) {
            case "/":
                component = <Lobby />;
                break;
            case "/login":
                component = <Login />;
                break;
            case "/logout":
                component = <Logout />;
                break;
            case "/register":
                component = <Register />;
                break;
            case "/decks":
                component = <Decks { ...boundActionCreators } />;
                break;
            case "/decks/add":
                component = <AddDeck />;
                break;
            case "/decks/edit":
                component = <EditDeck deckId={ arg } />;
                break;
            case "/play":
                if(this.props.currentGame && this.props.currentGame.started) {
                    component = <GameBoard />;
                    gameBoardVisible = true;
                } else {
                    component = <GameLobby />;
                }

                break;
            case "/how-to-play":
                component = <HowToPlay />;
                break;
            case "/about":
                component = <About />;
                break;
            case "/community":
                component = <Community />;
                break;
            case "/forgot":
                component = <ForgotPassword />;
                break;
            case "/reset-password":
                component = <ResetPassword id={ idArg } token={ tokenArg } />;
                break;
            case "/profile":
                component = <Profile />;
                break;
            case "/news":
                if(!permissions.canEditNews) {
                    component = <Unauthorised />;
                } else {
                    component = <NewsAdmin />;
                }

                break;
            case "/unauth":
                component = <Unauthorised />;
                break;
            case "/users":
                if(!permissions.canManageUsers) {
                    component = <Unauthorised />;
                } else {
                    component = <UserAdmin />;
                }

                break;
            case "/blocklist":
                component = <BlockList />;
                break;
            case "/replay":
                component = <GameReplay />;
                break;
            default:
                component = <NotFound />;
                break;
        }

        let backgroundClass = "bg";
        if(gameBoardVisible && this.props.user) {
            switch(this.props.user.settings.background) {
                case "CRAB":
                    backgroundClass = "bg-board-crab";
                    break;
                case "CRANE":
                    backgroundClass = "bg-board-crane";
                    break;
                case "DRAGON":
                    backgroundClass = "bg-board-dragon";
                    break;
                case "LION":
                    backgroundClass = "bg-board-lion";
                    break;
                case "PHOENIX":
                    backgroundClass = "bg-board-phoenix";
                    break;
                case "SCORPION":
                    backgroundClass = "bg-board-scorpion";
                    break;
                case "UNICORN":
                    backgroundClass = "bg-board-unicorn";
                    break;
                case "CRAB2":
                    backgroundClass = "bg-board-crab2";
                    break;
                case "CRAB3":
                    backgroundClass = "bg-board-crab3";
                    break;
                case "CRANE2":
                    backgroundClass = "bg-board-crane2";
                    break;
                case "CRANE3":
                    backgroundClass = "bg-board-crane3";
                    break;
                case "CRANE4":
                    backgroundClass = "bg-board-crane4";
                    break;
                case "DRAGON2":
                    backgroundClass = "bg-board-dragon2";
                    break;
                case "DRAGON3":
                    backgroundClass = "bg-board-dragon3";
                    break;
                case "LION2":
                    backgroundClass = "bg-board-lion2";
                    break;
                case "LION3":
                    backgroundClass = "bg-board-lion3";
                    break;
                case "PHOENIX2":
                    backgroundClass = "bg-board-phoenix2";
                    break;
                case "PHOENIX3":
                    backgroundClass = "bg-board-phoenix3";
                    break;
                case "SCORPION2":
                    backgroundClass = "bg-board-scorpion2";
                    break;
                case "SCORPION3":
                    backgroundClass = "bg-board-scorpion3";
                    break;
                case "UNICORN2":
                    backgroundClass = "bg-board-unicorn2";
                    break;
                case "UNICORN3":
                    backgroundClass = "bg-board-unicorn3";
                    break;
                case "OTTER":
                    backgroundClass = "bg-board-otter";
                    break;
                default:
                    backgroundClass = "bg-board-default";
                    break;
            }
        }

        return (<div className={ backgroundClass }>
            <NavBar leftMenu={ leftMenu } rightMenu={ rightMenu } title="Jigoku Online" currentPath={ this.props.path } numGames={ this.props.games.length } />
            <div className="container">
                <ErrorBoundary navigate={ this.props.navigate } errorPath={ this.props.path } message={ "We're sorry - something's gone wrong." }>
                    { component }
                </ErrorBoundary>
            </div>
        </div>);
    }
}

App.displayName = "Application";

function mapStateToProps(state) {
    return {
        currentGame: state.games.currentGame,
        currentGameId: state.games.gameId,
        disconnecting: state.socket.gameDisconnecting,
        gameSocket: state.socket.gameSocket,
        games: state.games.games,
        path: state.navigation.path,
        loggedIn: state.auth.loggedIn,
        token: state.auth.token,
        user: state.auth.user,
        username: state.auth.username
    };
}

function mapDispatchToProps(dispatch) {
    let boundActions = bindActionCreators(actions, dispatch);
    boundActions.dispatch = dispatch;

    return boundActions;
}

const Application = connect(mapStateToProps, mapDispatchToProps)(App);

export default Application;
