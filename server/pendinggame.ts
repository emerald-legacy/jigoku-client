import { v1 as uuidv1 } from "uuid";
import bcrypt from "bcrypt";

import logger from "./log.js";
import GameChat from "./game/gamechat.js";
import GameModes from "../shared/GameModes.js";
import type { UserIdentity } from "./LobbyProtocol.js";

export interface PendingGameOwner {
    username: string;
    blockList?: string[];
    [key: string]: unknown;
}

export interface PendingGamePlayer {
    id: string;
    name: string;
    user?: UserIdentity & { settings?: Record<string, unknown> };
    emailHash?: string;
    owner?: boolean;
    deck?: { name?: string; selected?: boolean; status?: unknown; faction?: { name: string; value: string }; [key: string]: unknown };
    faction?: { name: string; value: string; cardData?: { code: string } };
    agenda?: { cardData?: { code: string } };
    left?: boolean;
    disconnected?: boolean;
    settings?: Record<string, unknown>;
}

export interface PendingGameDetails {
    name: string;
    spectators?: boolean;
    spectatorSquelch?: boolean;
    gameMode?: string;
    gameType?: string;
    clocks?: unknown;
    password?: string;
}

interface PendingGameNode {
    identity: string;
    address?: string;
    port?: number;
    protocol?: string;
}

class PendingGame {
    owner: PendingGameOwner;
    players: Record<string, PendingGamePlayer>;
    spectators: Record<string, PendingGamePlayer>;
    id: string;
    name: string;
    allowSpectators: boolean;
    spectatorSquelch?: boolean;
    skirmishMode: boolean;
    gameMode?: string;
    gameType?: string;
    clocks?: unknown;
    createdAt: Date;
    gameChat: GameChat;
    node: PendingGameNode | null;
    started: boolean;
    password?: string;

    constructor(owner: PendingGameOwner, details: PendingGameDetails) {
        this.owner = owner;
        this.players = {};
        this.spectators = {};
        this.id = uuidv1();
        this.name = details.name;
        this.allowSpectators = details.spectators ?? true;
        this.spectatorSquelch = details.spectatorSquelch;
        this.skirmishMode = details.gameMode === GameModes.Skirmish;
        this.gameMode = details.gameMode;
        this.gameType = details.gameType;
        this.clocks = details.clocks;
        this.createdAt = new Date();
        this.gameChat = new GameChat();
        this.node = null;
        this.started = false;
    }

    // Getters
    getPlayersAndSpectators(): Record<string, PendingGamePlayer> {
        return Object.assign({}, this.players, this.spectators);
    }

    getPlayers(): Record<string, PendingGamePlayer> {
        return this.players;
    }

    getPlayerOrSpectator(playerName: string) {
        return this.getPlayersAndSpectators()[playerName];
    }

    getPlayerByName(playerName: string) {
        return this.players[playerName];
    }

    getSaveState() {
        var players = Object.values(this.getPlayers()).map(player => {
            return {
                faction: player.faction?.name ?? "",
                name: player.name
            };
        });

        return {
            gameId: this.id,
            gameType: this.gameType,
            players: players,
            startedAt: this.createdAt
        };
    }

    // Helpers
    setupFaction(player: PendingGamePlayer, faction: { name: string; value: string }) {
        player.faction = faction;
    }

    // Actions
    addMessage(message: string, ...args: unknown[]) {
        this.gameChat.addMessage(message, ...args);
    }

    addPlayer(id: string, user: UserIdentity) {
        this.players[user.username] = {
            id: id,
            name: user.username,
            user: user,
            emailHash: user.emailHash,
            owner: this.owner.username === user.username
        };
    }

    addSpectator(id: string, user: UserIdentity) {
        this.spectators[user.username] = {
            id: id,
            name: user.username,
            user: user,
            emailHash: user.emailHash
        };
    }

    newGame(id: string, user: UserIdentity, password: string | undefined, callback: (err?: Error | null, message?: string) => void) {
        if(password) {
            bcrypt.hash(password, 10, (err, hash) => {
                if(err) {
                    logger.error(`Error hashing game password: ${err}`);

                    callback(err);

                    return;
                }

                this.password = hash;
                this.addPlayer(id, user);

                callback();
            });
        } else {
            this.addPlayer(id, user);

            callback();
        }
    }

    isUserBlocked(user: { username: string }) {
        return this.owner.blockList && this.owner.blockList.includes(user.username.toLowerCase());
    }

    join(id: string, user: UserIdentity, password: string | undefined, callback: (err?: Error | null, message?: string) => void) {
        if(Object.keys(this.players).length === 2 || this.started) {
            return;
        }

        if(this.isUserBlocked(user)) {
            return;
        }

        if(this.password) {
            bcrypt.compare(password, this.password, (err, valid) => {
                if(err) {
                    return callback(new Error("Bad password"), "Incorrect game password");
                }

                if(!valid) {
                    return callback(new Error("Bad password"), "Incorrect game password");
                }

                this.addPlayer(id, user);

                callback();
            });
        } else {
            this.addPlayer(id, user);

            callback();
        }
    }

    watch(id: string, user: UserIdentity, password: string | undefined, callback: (err?: Error | null, message?: string) => void) {
        if(!this.allowSpectators) {
            callback(new Error("Join not permitted"));

            return;
        }

        if(this.isUserBlocked(user)) {
            return;
        }

        if(this.password) {
            bcrypt.compare(password, this.password, (err, valid) => {
                if(err) {
                    return callback(new Error("Bad password"), "Incorrect game password");
                }

                if(!valid) {
                    return callback(new Error("Bad password"), "Incorrect game password");
                }

                this.addSpectator(id, user);

                this.addMessage("{0} has joined the game as a spectator", user.username);
                callback();
            });
        } else {
            this.addSpectator(id, user);

            this.addMessage("{0} has joined the game as a spectator", user.username);

            callback();
        }
    }

    leave(playerName: string) {
        var player = this.getPlayerOrSpectator(playerName);
        if(!player) {
            return;
        }

        if(!this.started) {
            this.addMessage("{0} has left the game", playerName);
        }

        if(this.players[playerName]) {
            if(this.started) {
                this.players[playerName].left = true;
            } else {
                delete this.players[playerName];
            }
        }

        if(this.spectators[playerName]) {
            delete this.spectators[playerName];
        }
    }

    disconnect(playerName: string) {
        var player = this.getPlayerOrSpectator(playerName);
        if(!player) {
            return;
        }

        if(!this.started) {
            this.addMessage("{0} has disconnected", playerName);
        }

        if(this.players[playerName]) {
            if(!this.started) {
                delete this.players[playerName];
            }
        } else {
            delete this.spectators[playerName];
        }
    }

    chat(playerName: string, message: string) {
        var player = this.getPlayerOrSpectator(playerName);
        if(!player) {
            return;
        }

        this.addMessage("{0} {1}", player, message);
    }

    selectDeck(playerName: string, deck: PendingGamePlayer["deck"] & { faction: { name: string; value: string } }) {
        var player = this.getPlayerByName(playerName);
        if(!player) {
            return;
        }

        if(player.deck) {
            player.deck.selected = false;
        }

        player.deck = deck;
        player.deck.selected = true;

        this.setupFaction(player, deck.faction);
    }

    // interrogators
    isEmpty() {
        return !Object.values(this.getPlayersAndSpectators()).some(player => this.hasActivePlayer(player.name));
    }

    isOwner(playerName: string) {
        var player = this.players[playerName];

        if(!player || !player.owner) {
            return false;
        }

        return true;
    }

    hasActivePlayer(playerName: string) {
        return this.players[playerName] && !this.players[playerName].left && !this.players[playerName].disconnected || this.spectators[playerName];
    }

    // Summary
    getSummary(activePlayer?: string) {
        var playerSummaries: Record<string, unknown> = {};
        var playersInGame = Object.values(this.players).filter(player => !player.left);

        playersInGame.forEach(player => {
            var deck: Record<string, unknown> = {};

            if(activePlayer === player.name && player.deck) {
                deck = { name: player.deck.name, selected: player.deck.selected, status: player.deck.status };
            } else if(player.deck) {
                deck = { selected: player.deck.selected, status: player.deck.status };
            } else {
                deck = {};
            }

            playerSummaries[player.name] = {
                agenda: this.started && player.agenda ? player.agenda.cardData?.code : undefined,
                deck: activePlayer ? deck : {},
                emailHash: player.emailHash,
                faction: this.started && player.faction ? (player.faction.value ?? player.faction.cardData?.code) : undefined,
                id: player.id,
                left: player.left,
                name: player.name,
                owner: player.owner,
                settings: { disableGravatar: player.user?.settings?.disableGravatar }
            };
        });

        return {
            allowSpectators: this.allowSpectators,
            clocks: this.clocks,
            createdAt: this.createdAt,
            gameType: this.gameType,
            id: this.id,
            messages: activePlayer ? this.gameChat.messages : undefined,
            name: this.name,
            needsPassword: !!this.password,
            node: this.node ? this.node.identity : undefined,
            owner: this.owner.username,
            players: playerSummaries,
            spectatorSquelch: this.spectatorSquelch,
            skirmishMode: this.gameMode === GameModes.Skirmish, //TODO: Legacy support, remove this soon
            gameMode: this.gameMode,
            started: this.started,
            spectators: Object.values(this.spectators).map(spectator => {
                return {
                    id: spectator.id,
                    name: spectator.name,
                    emailHash: spectator.emailHash,
                    settings: spectator.settings
                };
            })
        };
    }
}

export default PendingGame;
