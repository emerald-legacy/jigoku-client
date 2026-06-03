import { Server, Socket as IoSocket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { differenceInSeconds } from "date-fns";
import type { Db } from "mongodb";

import Socket from "./socket.js";
import logger from "./log.js";
import PendingGame from "./pendinggame.js";
import GameRouter from "./gamerouter.js";
import DeckService from "./services/DeckService.js";
import CardService, { type CardRecord } from "./services/CardService.js";
import validateDeck from "../client/deck-validator.js";
import * as Settings from "./settings.js";
import GetShadowlandsSummonables from "./shadowLandsHelper.js";

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const ONE_HOUR = 60 * ONE_MINUTE;
const FOUR_HOURS = 4 * ONE_HOUR;

type LobbyConfig = typeof import("config")["default"] & { secret?: string };

interface LobbyUser {
    username: string;
    emailHash?: string;
    admin?: boolean;
    blockList?: string[];
    permissions?: Record<string, boolean>;
    settings?: { disableGravatar?: boolean; [key: string]: unknown };
    [key: string]: unknown;
}

type UserStatus = "lobby" | "playing" | "spectating";

interface LobbyOptions {
    config: LobbyConfig;
    db?: Db;
    deckService?: DeckService;
    cardService?: CardService;
    router?: GameRouter;
    io?: Server;
}

type DeckWithExtras = {
    outsideTheGameCards?: unknown;
    [key: string]: unknown;
};

class Lobby {
    sockets: Record<string, Socket>;
    users: Record<string, LobbyUser>;
    games: Record<string, PendingGame>;
    config: LobbyConfig;
    deckService: DeckService;
    cardService: CardService;
    router: GameRouter;
    titleCardData: unknown;
    io: Server;
    lastUserBroadcast: Date;
    pendingUserBroadcast: ReturnType<typeof setTimeout> | null;
    shortCardData: Record<string, CardRecord> | undefined;

    constructor(server: HttpServer, options: LobbyOptions) {
        this.sockets = {};
        this.users = {};
        this.games = {};
        this.config = options.config;
        this.deckService = options.deckService || new DeckService(options.db as Db);
        this.cardService = options.cardService || new CardService(options.db as Db);
        this.router = options.router || new GameRouter(this.config);
        this.titleCardData = null;

        this.router.on("onGameClosed", this.onGameClosed.bind(this));
        this.router.on("onPlayerLeft", this.onPlayerLeft.bind(this));
        this.router.on("onWorkerTimedOut", this.onWorkerTimedOut.bind(this));
        this.router.on("onNodeReconnected", this.onNodeReconnected.bind(this));
        this.router.on("onWorkerStarted", this.onWorkerStarted.bind(this));

        this.io = options.io || new Server(server, {
            perMessageDeflate: false,
            pingTimeout: 30000,
            pingInterval: 25000,
            cors: {
                origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
                credentials: true
            }
        });
        this.io.use(this.handshake.bind(this));
        this.io.on("connection", this.onConnection.bind(this));

        this.lastUserBroadcast = new Date(0);
        this.pendingUserBroadcast = null;

        this.loadCardData();

        setInterval(() => this.clearStaleGames(), ONE_MINUTE);
    }

    async loadCardData() {
        this.shortCardData = await this.cardService.getAllCards({ shortForm: true });
    }

    // External methods
    getStatus() {
        var nodeStatus = this.router.getNodeStatus();

        return nodeStatus;
    }

    disableNode(nodeName: string) {
        return this.router.disableNode(nodeName);
    }

    enableNode(nodeName: string) {
        return this.router.enableNode(nodeName);
    }

    debugDump() {
        var games = Object.values(this.games).map(game => {
            var players = Object.values(game.players).map(player => {
                return {
                    name: player.name,
                    left: player.left,
                    disconnected: player.disconnected,
                    id: player.id
                };
            });

            var spectators = Object.values(game.spectators).map(spectator => {
                return {
                    name: spectator.name,
                    id: spectator.id
                };
            });

            return {
                name: game.name,
                players: players,
                spectators: spectators,
                id: game.id,
                started: game.started,
                node: game.node ? game.node.identity : "None",
                startedAt: game.createdAt
            };
        });

        var nodes = this.router.getNodeStatus();

        return {
            games: games,
            nodes: nodes,
            socketCount: Object.keys(this.sockets).length,
            userCount: Object.keys(this.users).length
        };
    }

    // Helpers
    findGameForUser(user: string): PendingGame | undefined {
        return Object.values(this.games).find(game => {
            if(game.spectators[user]) {
                return true;
            }

            var player = game.players[user];

            if(!player || player.left) {
                return false;
            }

            return true;
        });
    }

    getUserStatus(username: string): UserStatus {
        for(let game of Object.values(this.games)) {
            let player = game.players[username];
            if(player && !player.left) {
                return "playing";
            }
            if(game.spectators[username]) {
                return "spectating";
            }
        }
        return "lobby";
    }

    getUserList() {
        let userList = Object.values(this.users).map(user => {
            return {
                name: user.username,
                emailHash: user.emailHash,
                noAvatar: user.settings?.disableGravatar,
                isPatron: !!user.permissions?.isPatron,
                status: this.getUserStatus(user.username)
            };
        });

        userList = userList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        return userList;
    }

    handshake(socket: IoSocket, next: (err?: Error) => void) {
        const token = socket.handshake.auth?.token;

        const finalize = () => {
            next();
        };

        if(token && token !== "undefined") {
            jwt.verify(token, this.config.secret as string, { algorithms: ["HS256"] }, function(err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) {
                if(err) {
                    logger.info(`Lobby JWT verification failed: ${err.message}`);
                    return next(new Error("Invalid authentication token"));
                }
                (socket.request as { user?: jwt.JwtPayload | string }).user = decoded;
                finalize();
            });
            return;
        }

        finalize();
    }

    // Actions
    filterGameListWithBlockList(user: LobbyUser | undefined): PendingGame[] | Record<string, PendingGame> {
        if(!user) {
            return this.games;
        }

        return Object.values(this.games).filter(game => {
            let userBlockedByOwner = game.isUserBlocked(user);
            let userHasBlockedPlayer = Object.values(game.players).some(player => user.blockList && user.blockList.includes(player.name.toLowerCase()));
            return !userBlockedByOwner && !userHasBlockedPlayer;
        });
    }

    mapGamesToGameSummaries(games: PendingGame[] | Record<string, PendingGame>) {
        const gamesArray: PendingGame[] = Array.isArray(games) ? games : Object.values(games);
        return gamesArray
            .map(game => game.getSummary())
            .sort((a, b) => new Date(b.createdAt as string | number | Date).getTime() - new Date(a.createdAt as string | number | Date).getTime())
            .sort((a, b) => (a.started === b.started) ? 0 : a.started ? 1 : -1);
    }

    sendUserListFilteredWithBlockList(socket: Socket, userList: { name: string; emailHash?: string; noAvatar?: boolean; isPatron?: boolean; status: UserStatus }[]) {
        let filteredUsers = userList;

        if(socket.user && socket.user.blockList) {
            const blockList = socket.user.blockList as string[];
            filteredUsers = userList.filter(user => !blockList.includes(user.name.toLowerCase()));
        }

        socket.send("users", filteredUsers);
    }

    broadcastGameList(socket?: Socket) {
        let sockets: Socket[] = socket ? [socket] : Object.values(this.sockets);
        sockets.forEach(socket => {
            if(socket) {
                let filteredGames = this.filterGameListWithBlockList(socket.user as LobbyUser | undefined);
                let gameSummaries = this.mapGamesToGameSummaries(filteredGames);
                socket.send("games", gameSummaries);
            }
        });
    }

    broadcastUserList() {
        const MIN_INTERVAL_SECONDS = 5;
        const now = new Date();
        const elapsed = differenceInSeconds(now, this.lastUserBroadcast);

        if(elapsed < MIN_INTERVAL_SECONDS) {
            if(this.pendingUserBroadcast) {
                return;
            }
            const delayMs = (MIN_INTERVAL_SECONDS - elapsed) * 1000;
            this.pendingUserBroadcast = setTimeout(() => {
                this.pendingUserBroadcast = null;
                this.sendUserListToAll();
            }, delayMs);
            return;
        }

        this.sendUserListToAll();
    }

    sendUserListToAll() {
        this.lastUserBroadcast = new Date();
        const users = this.getUserList();

        Object.values(this.sockets).forEach(socket => {
            if(socket) {
                this.sendUserListFilteredWithBlockList(socket, users);
            }
        });
    }

    sendGameState(game: PendingGame) {
        if(game.started) {
            return;
        }

        Object.values(game.getPlayersAndSpectators()).forEach(player => {
            if(!this.sockets[player.id]) {
                logger.info(`Wanted to send to ${player.id} but have no socket`);
                return;
            }

            this.sockets[player.id].send("gamestate", game.getSummary(player.name));
        });
    }

    clearGamesForNode(nodeName: string) {
        Object.values(this.games).forEach(game => {
            if(game.node && game.node.identity === nodeName) {
                delete this.games[game.id];
            }
        });

        this.broadcastGameList();
    }

    clearStaleGames() {
        let now = Date.now();
        const pendingTimeout = ONE_HOUR;
        let changed = false;

        Object.values(this.games).forEach(game => {
            if(!game) {
                return;
            }

            let age = now - game.createdAt.getTime();

            // Pending games older than 1 hour
            if(!game.started && age > pendingTimeout) {
                logger.info(`closed pending game ${game.id} due to inactivity`);
                delete this.games[game.id];
                changed = true;
                return;
            }

            if(!game.started) {
                return;
            }

            // Started games with no players after 5 minutes
            if(age > FIVE_MINUTES && Object.keys(game.getPlayers()).length === 0) {
                logger.info(`closed started game ${game.id} due to no active players`);
                delete this.games[game.id];
                this.router.closeGame(game);
                changed = true;
                return;
            }

            // Started games whose node no longer exists
            if(game.node && !this.router.workers[game.node.identity]) {
                logger.info(`closed game ${game.id} because node ${game.node.identity} is no longer connected`);
                delete this.games[game.id];
                changed = true;
                return;
            }

            // Any game older than 4 hours is stale
            if(age > FOUR_HOURS) {
                logger.info(`closed game ${game.id} after ${Math.round(age / ONE_HOUR)}h (maximum game age exceeded)`);
                delete this.games[game.id];
                this.router.closeGame(game);
                changed = true;
            }
        });

        if(changed) {
            this.broadcastGameList();
        }
    }

    // Events
    onConnection(ioSocket: IoSocket) {
        var socket = new Socket(ioSocket, { config: this.config });

        socket.registerEvent("newgame", this.onNewGame.bind(this));
        socket.registerEvent("joingame", this.onJoinGame.bind(this));
        socket.registerEvent("leavegame", this.onLeaveGame.bind(this));
        socket.registerEvent("watchgame", this.onWatchGame.bind(this));
        socket.registerEvent("startgame", this.onStartGame.bind(this));
        socket.registerEvent("chat", this.onPendingGameChat.bind(this));
        socket.registerEvent("selectdeck", this.onSelectDeck.bind(this));
        socket.registerEvent("connectfailed", this.onConnectFailed.bind(this));
        socket.registerEvent("removegame", this.onRemoveGame.bind(this));

        socket.on("authenticate", this.onAuthenticated.bind(this));
        socket.on("disconnect", this.onSocketDisconnected.bind(this));

        this.sockets[ioSocket.id] = socket;

        if(socket.user) {
            this.users[socket.user.username] = Settings.getUserWithDefaultsSet(socket.user);

            this.broadcastUserList();
        }

        // Force user list send for the newly connected socket, bypassing the throttle
        this.sendUserListFilteredWithBlockList(socket, this.getUserList());

        this.broadcastGameList(socket);

        if(!socket || !socket.user) {
            return;
        }

        var game = this.findGameForUser(socket.user.username);
        if(game && game.started) {
            socket.send("handoff", { address: game.node.address, port: game.node.port, protocol: game.node.protocol, name: game.node.identity, gameId: game.id });
        }
    }

    onAuthenticated(_socket: Socket, user: LobbyUser) {
        let userWithDefaults = Settings.getUserWithDefaultsSet(user);
        this.users[user.username] = userWithDefaults;

        this.broadcastUserList();
    }

    onSocketDisconnected(socket: Socket, reason: string) {
        if(!socket) {
            return;
        }

        delete this.sockets[socket.id];

        if(!socket.user) {
            return;
        }

        delete this.users[socket.user.username];

        logger.info("user '%s' disconnected from the lobby: %s", socket.user.username, reason);

        var game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        game.disconnect(socket.user.username);

        if(game.isEmpty()) {
            delete this.games[game.id];
        } else {
            this.sendGameState(game);
        }

        this.broadcastGameList();
        this.broadcastUserList();
    }

    onNewGame(socket: Socket, gameDetails: import("./pendinggame.js").PendingGameDetails & { password?: string }) {
        if(!socket.user) {
            return;
        }
        var existingGame = this.findGameForUser(socket.user.username);
        if(existingGame) {
            return;
        }

        let game = new PendingGame(socket.user as import("./pendinggame.js").PendingGameOwner, gameDetails);
        game.newGame(socket.id, socket.user as { username: string; emailHash?: string }, gameDetails.password, (err, message) => {
            if(err) {
                logger.info(`game failed to create: ${err} ${message}`);

                return;
            }

            socket.joinChannel(game.id);
            this.sendGameState(game);

            this.games[game.id] = game;
            this.broadcastGameList();
            this.broadcastUserList();
        });
    }

    onJoinGame(socket: Socket, gameId: string, password: string) {
        if(!socket.user) {
            return;
        }
        var existingGame = this.findGameForUser(socket.user.username);
        if(existingGame) {
            return;
        }

        var game = this.games[gameId];
        if(!game) {
            return;
        }

        game.join(socket.id, socket.user as { username: string; emailHash?: string }, password, (err, message) => {
            if(err) {
                socket.send("passworderror", message);

                return;
            }

            socket.joinChannel(game.id);

            this.sendGameState(game);

            this.broadcastGameList();
            this.broadcastUserList();
        });
    }

    onStartGame(socket: Socket, gameId: string) {
        if(!socket.user) {
            return;
        }
        var game = this.games[gameId];

        if(!game || game.started) {
            return;
        }

        if(Object.values(game.getPlayers()).some(function(player) {
            return !player.deck;
        })) {
            return;
        }

        if(!game.isOwner(socket.user.username)) {
            return;
        }

        var gameNode = this.router.startGame(game);
        if(!gameNode) {
            return;
        }

        game.node = gameNode;
        game.started = true;

        this.broadcastGameList();

        this.io.to(game.id).emit("handoff", { address: gameNode.address, port: gameNode.port, protocol: game.node.protocol, name: game.node.identity });
    }

    onWatchGame(socket: Socket, gameId: string, password: string) {
        if(!socket.user) {
            return;
        }
        var existingGame = this.findGameForUser(socket.user.username);
        if(existingGame) {
            return;
        }

        var game = this.games[gameId];
        if(!game) {
            return;
        }

        game.watch(socket.id, socket.user as { username: string; emailHash?: string }, password, (err, message) => {
            if(err) {
                socket.send("passworderror", message);

                return;
            }

            socket.joinChannel(game.id);

            if(game.started) {
                this.router.addSpectator(game, socket.user as { username: string });
                socket.send("handoff", { address: game.node?.address, port: game.node?.port, protocol: game.node?.protocol, name: game.node?.identity });
            } else {
                this.sendGameState(game);
            }

            this.broadcastUserList();
        });
    }

    onLeaveGame(socket: Socket) {
        if(!socket.user) {
            return;
        }
        var game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        game.leave(socket.user.username);
        socket.send("cleargamestate");
        socket.leaveChannel(game.id);

        if(game.isEmpty()) {
            delete this.games[game.id];
        } else {
            this.sendGameState(game);
        }

        this.broadcastGameList();
        this.broadcastUserList();
    }

    onPendingGameChat(socket: Socket, message: string) {
        if(!socket.user) {
            return;
        }
        var game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        game.chat(socket.user.username, message);
        this.sendGameState(game);
    }

    onSelectDeck(socket: Socket, gameId: string, deckId: string | { _id: string }) {
        if(!socket.user) {
            return;
        }
        let resolvedDeckId: string = typeof deckId === "object" && deckId !== null ? deckId._id : (deckId as string);

        var game = this.games[gameId];
        if(!game) {
            return;
        }

        Promise.all([this.cardService.getAllCards(), this.cardService.getAllPacks(), this.deckService.getById(resolvedDeckId)])
            .then(async results => {
                let [cards, packs, deck] = results;

                if(!deck || deck.username !== socket.user!.username) {
                    return;
                }

                const cardsMap = (cards || {}) as unknown as Record<string, import("../client/types/game.js").Card>;

                if(deck.stronghold) {
                    deck.stronghold.forEach(stronghold => {
                        stronghold.card = cardsMap[stronghold.card.id];
                    });
                }

                if(deck.role) {
                    deck.role.forEach(role => {
                        role.card = cardsMap[role.card.id];
                    });
                }

                if(deck.provinceCards) {
                    deck.provinceCards.forEach(province => {
                        province.card = cardsMap[province.card.id];
                    });
                }

                if(deck.conflictCards) {
                    deck.conflictCards.forEach(conflict => {
                        conflict.card = cardsMap[conflict.card.id];
                    });
                }

                if(deck.dynastyCards) {
                    deck.dynastyCards.forEach(dynasty => {
                        dynasty.card = cardsMap[dynasty.card.id];
                    });
                }

                (deck as DeckWithExtras).outsideTheGameCards = GetShadowlandsSummonables(cardsMap);

                deck.status = await validateDeck(deck, { packs: packs, includeExtendedStatus: false, gameMode: game.gameMode });
                if(!deck.faction) {
                    return;
                }
                game.selectDeck(socket.user!.username, deck as { faction: { name: string; value: string }; [key: string]: unknown });

                this.sendGameState(game);
            })
            .catch(err => {
                logger.info(`Error loading deck: ${err}`);

                return;
            });
    }

    onConnectFailed(socket: Socket) {
        if(!socket.user) {
            return;
        }
        var game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        logger.info("user '%s' failed to handoff to game server", socket.user.username);
        this.router.notifyFailedConnect(game, socket.user.username);
    }

    onRemoveGame(socket: Socket, gameId: string) {
        if(!socket.user) {
            return;
        }
        var isAdmin = socket && socket.user.admin;
        var game = this.games[gameId];
        if(!game) {
            return;
        }

        var isOwner = game.owner.username === socket.user.username;
        if(!isAdmin && !isOwner) {
            return;
        }

        logger.info(`${socket.user.username} closed game ${game.id} (${game.name}) forcefully`);

        if(!game.started) {
            delete this.games[game.id];
            this.broadcastGameList();
            this.broadcastUserList();
        } else {
            this.router.closeGame(game);
        }
    }

    // router Events
    onGameClosed(gameId: string) {
        var game = this.games[gameId];

        if(!game) {
            return;
        }

        delete this.games[gameId];

        this.broadcastGameList();
        this.broadcastUserList();
    }

    onPlayerLeft(gameId: string, player: string) {
        var game = this.games[gameId];

        if(!game) {
            return;
        }

        game.leave(player);

        if(game.isEmpty()) {
            delete this.games[gameId];
        }

        this.broadcastGameList();
        this.broadcastUserList();
    }

    onWorkerTimedOut(nodeName: string) {
        this.clearGamesForNode(nodeName);
    }

    onWorkerStarted(nodeName: string) {
        const shortCardData = this.shortCardData ? Object.values(this.shortCardData) : [];
        this.router.sendCommand(nodeName, "CARDDATA", { titleCardData: this.titleCardData, shortCardData });
    }

    onNodeReconnected(nodeName: string, games: Record<string, NodeReconnectedGame>) {
        for(let game of Object.values(games)) {
            if(!game || !game.owner || !game.players) {
                continue;
            }

            let owner: NodeReconnectedPlayer | undefined = undefined;
            for(let player of Object.values(game.players)) {
                if(player.name === game.owner) {
                    owner = player;
                    break;
                }
            }

            if(!owner) {
                logger.error(`Got a game where the owner wasn't a player: ${game.owner}`);
                continue;
            }

            let syncGame = new PendingGame({ username: game.owner }, { spectators: game.allowSpectators, name: game.name });
            syncGame.id = game.id;
            syncGame.node = this.router.workers[nodeName];
            syncGame.createdAt = new Date(game.startedAt);
            syncGame.started = game.started;
            syncGame.gameType = game.gameType;
            syncGame.password = game.password;

            for(let player of Object.values(game.players)) {
                if(!player) {
                    continue;
                }

                syncGame.players[player.name] = {
                    id: player.id,
                    name: player.name,
                    emailHash: player.emailHash,
                    owner: game.owner === player.name,
                    faction: { name: player.faction || "", value: player.faction || "", cardData: { code: player.faction || "" } }
                };
            }

            for(let player of Object.values(game.spectators || {})) {
                if(!player) {
                    continue;
                }

                syncGame.spectators[player.name] = {
                    id: player.id,
                    name: player.name,
                    emailHash: player.emailHash
                };
            }
            this.games[syncGame.id] = syncGame;
        }

        for(let game of Object.values(this.games)) {
            if(!game) {
                continue;
            }

            if(game.node && game.node.identity === nodeName && Object.values(games).find(nodeGame => {
                return nodeGame && game && nodeGame.id === game.id;
            })) {
                this.games[game.id] = game;
            } else if(game.node && game.node.identity === nodeName) {
                delete this.games[game.id];
            }
        }

        this.broadcastGameList();
    }
}

interface NodeReconnectedPlayer {
    id: string;
    name: string;
    emailHash?: string;
    faction?: string;
}

interface NodeReconnectedGame {
    id: string;
    owner: string;
    players: Record<string, NodeReconnectedPlayer>;
    spectators?: Record<string, NodeReconnectedPlayer>;
    allowSpectators?: boolean;
    name: string;
    startedAt: string | number | Date;
    started: boolean;
    gameType?: string;
    password?: string;
}

export default Lobby;
