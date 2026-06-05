// Mirror of jigoku/server/gamenode/LobbyProtocol.ts (manual copy — no shared module).
// POV is the lobby: "Inbound" = game-node → lobby; "Outbound" = lobby → game-node.

export const PROTOCOL_VERSION = 1;

// ----- Shared DTOs (must mirror game-node side) -----

export interface LobbyUser {
    username: string;
    id?: string;
    emailHash?: string;
    settings?: unknown;
    blockList?: string[];
    [key: string]: unknown;
}

export interface UserIdentity {
    username: string;
    emailHash?: string;
}

export interface DeckDTO {
    _id?: unknown;
    name?: string;
    selected?: boolean;
    status?: unknown;
    faction?: { name?: string; value?: string };
    conflictCards?: unknown[];
    dynastyCards?: unknown[];
    stronghold?: unknown[];
    role?: unknown[];
    provinceCards?: unknown[];
    [key: string]: unknown;
}

export interface PendingPlayerDTO {
    id: string;
    name: string;
    user?: UserIdentity & { settings?: unknown };
    emailHash?: string;
    owner?: boolean;
    left?: boolean;
    disconnected?: boolean;
    deck?: DeckDTO;
    faction?: { name?: string; value?: string };
    agenda?: { cardData?: { code?: string } };
}

export interface PendingSpectatorDTO {
    id: string;
    name: string;
    user?: UserIdentity;
    emailHash?: string;
    settings?: unknown;
}

export interface PendingGameDTO {
    id: string;
    name: string;
    owner: string;
    players: Record<string, PendingPlayerDTO>;
    spectators: Record<string, PendingSpectatorDTO>;
    allowSpectators: boolean;
    spectatorSquelch?: boolean;
    gameType?: string;
    gameMode?: string;
    clocks?: unknown;
    createdAt: Date | string;
    started: boolean;
    node?: { identity?: string } | null;
    password?: string;
    gameChat?: unknown;
}

export interface PlayerSaveState {
    name: string;
    faction: string;
    honor: number;
    lostProvinces: number;
    deck?: unknown;
    deckId?: string;
}

export interface GameSaveState {
    id?: unknown;
    gameId: string;
    startedAt?: Date | string;
    players: PlayerSaveState[];
    winner?: string;
    winReason?: string;
    gameMode: string;
    finishedAt?: Date | string;
    roundNumber: number;
    initialFirstPlayer?: string | null;
}

export interface PlayerSummary {
    deck: { name?: string; selected?: boolean };
    emailHash?: string;
    faction?: string;
    id: string;
    lobbyId?: string;
    left?: boolean;
    name: string;
    owner: boolean;
}

export interface GameSummary {
    allowSpectators: boolean;
    createdAt: Date | string;
    gameType: string;
    id: string;
    manualMode: boolean;
    messages: unknown[];
    name: string;
    owner: string;
    players: Record<string, PlayerSummary>;
    started: boolean;
    startedAt?: Date | string;
    gameMode: string;
    spectators: Array<{ id: string; lobbyId?: string; name: string }>;
    password?: string;
}

// ----- Inbound (game-node → lobby) — mirrors game-node OutboundMessage -----

export interface HelloPayload {
    maxGames: number;
    address: string;
    port: number;
    protocol: string;
    version: string;
    protocolVersion?: number;
    games: GameSummary[];
}

export interface GameErrorPayload {
    gameId: string;
    gameName: string;
    players: string[];
    errorMessage: string;
    errorStack: string | undefined;
    timestamp: string;
    debugData: unknown;
}

export type InboundMessage =
    | { command: "HELLO"; arg: HelloPayload }
    | { command: "HEARTBEAT"; arg?: unknown }
    | { command: "PONG"; arg?: unknown }
    | { command: "GAMEERROR"; arg: GameErrorPayload }
    | { command: "GAMECLOSED"; arg: { game?: string } }
    | { command: "GAMEWIN"; arg: { game: GameSaveState } }
    | { command: "PLAYERLEFT"; arg: { gameId: string; game: GameSaveState; player: string; spectator: boolean } };

export type InboundCommand = InboundMessage["command"];

// ----- Outbound (lobby → game-node) — mirrors game-node InboundMessage -----

export interface SpectatorArg {
    game: PendingGameDTO;
    user: UserIdentity;
}

export interface ConnectFailedArg {
    gameId: string;
    username: string;
}

export interface CloseGameArg {
    gameId: string;
}

export type OutboundMessage =
    | { command: "PING"; arg?: unknown }
    | { command: "REGISTER"; arg?: unknown }
    | { command: "STARTGAME"; arg: PendingGameDTO }
    | { command: "SPECTATOR"; arg: SpectatorArg }
    | { command: "CONNECTFAILED"; arg: ConnectFailedArg }
    | { command: "CLOSEGAME"; arg: CloseGameArg }
    | { command: "CARDDATA"; arg: unknown };

export type OutboundCommand = OutboundMessage["command"];

// Narrow `unknown` parsed JSON into a known InboundMessage. Returns null if not recognised.
export function parseInbound(raw: unknown): InboundMessage | null {
    if(!raw || typeof raw !== "object") {
        return null;
    }
    const obj = raw as { command?: unknown; arg?: unknown };
    if(typeof obj.command !== "string") {
        return null;
    }
    switch(obj.command) {
        case "HELLO":
        case "HEARTBEAT":
        case "PONG":
        case "GAMEERROR":
        case "GAMECLOSED":
        case "GAMEWIN":
        case "PLAYERLEFT":
            return { command: obj.command, arg: obj.arg } as InboundMessage;
        default:
            return null;
    }
}
