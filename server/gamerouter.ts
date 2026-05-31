import { WebSocketServer, WebSocket } from "ws";
import config from "config";
import { EventEmitter } from "node:events";

type ConfigInstance = typeof config;

import logger from "./log.js";
import db from "./db.js";
import GameService, { type GameRecord } from "./services/GameService.js";
import GameStatsService from "./services/GameStatsService.js";
import DeckStatsService from "./services/DeckStatsService.js";
import GameErrorService from "./services/GameErrorService.js";
import type PendingGame from "./pendinggame.js";
import {
    parseInbound,
    type InboundMessage,
    type LobbyUser,
    type OutboundCommand,
    type OutboundMessage
} from "./LobbyProtocol.js";

type OutboundArg<C extends OutboundCommand> = Extract<OutboundMessage, { command: C }>["arg"];

const ONE_SECOND = 1000;
const FIFTEEN_SECONDS = 15 * ONE_SECOND;
const THIRTY_SECONDS = 30 * ONE_SECOND;

export interface GameWorker {
    identity: string;
    maxGames: number;
    numGames: number;
    address: string;
    port: number;
    protocol: string;
    version: string;
    disabled?: boolean;
    pingSent?: number;
    lastMessage?: number;
}

export interface RouterGame {
    id: string;
    node?: { identity: string; address?: string; port?: number; protocol?: string } | null;
    getSaveState?: () => GameRecord;
}

type GameWinGame = GameRecord & {
    winner?: string;
    winReason?: string;
    gameId?: string;
};

class GameRouter extends EventEmitter {
    workers: Record<string, GameWorker>;
    gameService: GameService;
    gameStatsService: GameStatsService;
    deckStatsService: DeckStatsService;
    gameErrorService: GameErrorService;
    connections: Map<string, WebSocket>;
    wss?: WebSocketServer;

    constructor(config: ConfigInstance) {
        super();

        this.workers = {};
        this.gameService = new GameService(db.getDb());
        this.gameStatsService = GameStatsService.getInstance(db.getDb());
        this.deckStatsService = new DeckStatsService(db.getDb());
        this.gameErrorService = new GameErrorService(db.getDb());
        this.connections = new Map();

        this.init(config.get("lobbyWsUrl"));
        setInterval(this.checkTimeouts.bind(this), FIFTEEN_SECONDS);
    }

    init(listenUrl: string) {
        const parsed = new URL(listenUrl);
        const port = parseInt(parsed.port, 10) || 6000;

        this.wss = new WebSocketServer({ port });
        logger.info(`GameRouter listening on ws://0.0.0.0:${port}`);

        this.wss.on("connection", (ws, req) => {
            const parsed = new URL(req.url || "/", "http://localhost");
            const identity = parsed.searchParams.get("identity");
            const nodeSecret: string | null = config.has("nodeSecret") ? config.get("nodeSecret") : null;

            if(!identity) {
                logger.error("WebSocket connection without identity, closing");
                ws.close();
                return;
            }

            if(!nodeSecret) {
                logger.error(`Game node ${identity} rejected: NODE_SECRET not configured on lobby`);
                ws.close();
                return;
            }

            if(parsed.searchParams.get("secret") !== nodeSecret) {
                logger.error(`Game node ${identity} rejected: invalid secret`);
                ws.close();
                return;
            }

            logger.info(`Game node connected: ${identity}`);
            this.connections.set(identity, ws);

            ws.on("message", (data) => {
                this.onMessage(identity, data);
            });

            ws.on("close", () => {
                logger.info(`Game node disconnected: ${identity}`);
                this.connections.delete(identity);
            });

            ws.on("error", (err) => {
                logger.error(`WebSocket error from ${identity}: ${err.message}`);
            });
        });
    }

    // External methods
    startGame(game: PendingGame): GameWorker | undefined {
        var node = this.getNextAvailableGameNode();

        if(!node) {
            logger.error("Could not find new node for game");
            return;
        }
        logger.info(`starting game on node ${node.identity}`);

        this.gameService.create(game.getSaveState() as GameRecord);

        node.numGames++;

        this.sendCommand(node.identity, "STARTGAME", game);
        return node;
    }

    addSpectator(game: PendingGame, user: LobbyUser) {
        if(!game.node) {
            return;
        }
        this.sendCommand(game.node.identity, "SPECTATOR", { game: game, user: user });
    }

    getNextAvailableGameNode(): GameWorker | undefined {
        const workerList = Object.values(this.workers);
        if(workerList.length === 0) {
            return undefined;
        }

        var returnedWorker: GameWorker | undefined = undefined;

        workerList.forEach(worker => {
            if(worker.numGames >= worker.maxGames || worker.disabled) {
                return;
            }

            if(!returnedWorker || returnedWorker.numGames > worker.numGames) {
                returnedWorker = worker;
            }
        });

        return returnedWorker;
    }

    getNodeStatus() {
        return Object.values(this.workers).map(worker => {
            return { name: worker.identity, numGames: worker.numGames, status: worker.disabled ? "disabled" : "active", version: worker.version };
        });
    }

    disableNode(nodeName: string) {
        var worker = this.workers[nodeName];
        if(!worker) {
            return false;
        }

        worker.disabled = true;

        return true;
    }

    enableNode(nodeName: string) {
        var worker = this.workers[nodeName];
        if(!worker) {
            return false;
        }

        worker.disabled = false;

        return true;
    }

    notifyFailedConnect(game: RouterGame, username: string) {
        if(!game.node) {
            return;
        }
        logger.info(`notify failed connect ${game.node.identity}`);

        this.sendCommand(game.node.identity, "CONNECTFAILED", { gameId: game.id, username: username });
    }

    closeGame(game: RouterGame) {
        if(!game.node) {
            return;
        }

        this.sendCommand(game.node.identity, "CLOSEGAME", { gameId: game.id });
    }

    // Events
    onMessage(identity: string, data: unknown) {
        var identityStr = identity.toString();

        var worker = this.workers[identityStr];

        let parsed: unknown;
        try {
            parsed = JSON.parse((data as { toString: () => string }).toString());
        } catch(err) {
            logger.error(`Failed to parse message from ${identityStr}: ${err}`);
            return;
        }

        const message: InboundMessage | null = parseInbound(parsed);
        if(!message) {
            logger.error(`Unrecognised message from ${identityStr}: ${JSON.stringify(parsed)}`);
            return;
        }

        switch(message.command) {
            case "HEARTBEAT":
                logger.debug(`received HEARTBEAT from ${identityStr}`);
                if(!worker) {
                    logger.info("Unknown node %s sent heartbeat, requesting registration", identityStr);
                    this.sendCommand(identityStr, "REGISTER");
                }
                break;
            case "PONG":
                logger.debug(`received PONG from ${identityStr}`);
                if(worker) {
                    worker.pingSent = undefined;
                } else {
                    logger.error("PONG received for unknown worker");
                }
                break;
            case "HELLO": {
                logger.info(`received HELLO from ${identityStr}`);
                this.emit("onWorkerStarted", identityStr);
                const arg = message.arg;
                this.workers[identityStr] = {
                    identity: identityStr,
                    maxGames: arg.maxGames || 20,
                    numGames: 0,
                    address: arg.address ?? "",
                    port: arg.port ?? 0,
                    protocol: arg.protocol ?? "ws",
                    version: arg.version || "unknown"
                };
                worker = this.workers[identityStr];

                this.emit("onNodeReconnected", identityStr, arg.games);

                worker.numGames = (arg.games ?? []).length;

                break;
            }
            case "GAMEWIN": {
                logger.info(`received GAMEWIN from ${identityStr}`);
                const game = message.arg?.game as GameWinGame | undefined;
                if(!game || !game.gameId || !Array.isArray(game.players) || !game.players.some((p: { name: string }) => p.name === game.winner)) {
                    logger.error(`Invalid GAMEWIN payload from ${identityStr}: ${JSON.stringify(game)}`);
                    break;
                }
                this.gameService.update(game);
                this.gameStatsService.invalidateCache();
                this.updateDeckStats(game);
                break;
            }
            case "GAMECLOSED":
                logger.info(`received GAMECLOSED from ${identityStr}`);
                if(worker) {
                    worker.numGames--;
                } else {
                    logger.error(`Got close game for non existent worker ${identity}`);
                }

                this.emit("onGameClosed", message.arg?.game);

                break;
            case "PLAYERLEFT":
                logger.info(`received PLAYERLEFT from ${identityStr}`);
                if(!message.arg.spectator && message.arg.game) {
                    this.gameService.update(message.arg.game as GameRecord);
                }

                this.emit("onPlayerLeft", message.arg.gameId, message.arg.player);

                break;
            case "GAMEERROR": {
                logger.info(`received GAMEERROR from ${identityStr}`);
                const arg = message.arg;
                if(!arg || !arg.gameId || !arg.errorMessage || !arg.timestamp || !Array.isArray(arg.players)) {
                    logger.error(`Invalid GAMEERROR payload from ${identityStr}`);
                    break;
                }
                this.gameErrorService.addError({
                    gameId: arg.gameId,
                    gameName: arg.gameName,
                    players: arg.players,
                    errorMessage: arg.errorMessage,
                    errorStack: arg.errorStack,
                    timestamp: new Date(arg.timestamp),
                    debugData: arg.debugData
                }).catch((err: Error) => {
                    logger.error(`Failed to persist game error: ${err}`);
                });
                break;
            }
        }

        if(worker) {
            worker.lastMessage = Date.now();
        }
    }

    updateDeckStats(game: GameRecord & { winner?: string; winReason?: string }) {
        if(!game || !game.players || !game.winner || !game.winReason) {
            return;
        }

        const normalizeClan = (faction: string | undefined) => {
            if(!faction) {
                return null;
            }
            // Handle "Crab Clan" -> "crab", or already lowercase "crab" -> "crab"
            return faction.toLowerCase().replace(/\s*clan\s*/i, "").trim();
        };

        const players = Array.isArray(game.players) ? game.players : Object.values(game.players);

        for(const player of players) {
            if(!player.deckId) {
                continue;
            }

            const won = player.name === game.winner;
            const opponent = players.find(p => p.name !== player.name);
            const opponentClan = opponent ? normalizeClan(opponent.faction) : null;

            this.deckStatsService.recordGameResult(player.deckId, {
                won,
                opponentClan,
                winReason: game.winReason,
                username: player.name
            }).catch((err: Error) => {
                logger.error(`Failed to update deck stats: ${err}`);
            });
        }
    }

    // Internal methods
    sendCommand<C extends OutboundCommand>(identity: string, command: C, arg?: OutboundArg<C>) {
        const logLevel = (command === "PING") ? "debug" : "info";
        logger[logLevel](`sending ${command} to ${identity}`);

        const ws = this.connections.get(identity);
        if(!ws || ws.readyState !== 1) {
            logger.error(`Cannot send ${command} to ${identity}: not connected`);
            return;
        }

        try {
            ws.send(JSON.stringify({ command: command, arg: arg }));
        } catch(err) {
            logger.error(`Error sending command: ${err}`);
        }
    }

    checkTimeouts() {
        var currentTime = Date.now();
        const pingTimeout = THIRTY_SECONDS;

        Object.values(this.workers).forEach(worker => {
            if(worker.pingSent && currentTime - worker.pingSent > pingTimeout) {
                logger.info(`worker ${worker.identity} timed out`);
                delete this.workers[worker.identity];
                this.emit("onWorkerTimedOut", worker.identity);
            } else if(!worker.pingSent) {
                if(currentTime - worker.lastMessage > pingTimeout) {
                    worker.pingSent = currentTime;
                    this.sendCommand(worker.identity, "PING");
                }
            }
        });
    }

    close() {
        if(this.wss) {
            this.wss.close();
        }
    }
}

export default GameRouter;
