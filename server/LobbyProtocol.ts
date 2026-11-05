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
    gameMode?: string;
    finishedAt?: Date | string;
    roundNumber: number;
    initialFirstPlayer?: string | null;
}

export interface PlayerSummary {
    deck: { name?: string; selected?: boolean };
    emailHash?: string;
    faction?: string;
    id: string;
    left?: boolean;
    name: string;
    owner: boolean;
}

export interface GameSummary {
    allowSpectators: boolean;
    createdAt: Date | string;
    gameType?: string;
    id: string;
    manualMode: boolean;
    name: string;
    owner: string;
    players: Record<string, PlayerSummary>;
    started: boolean;
    startedAt?: Date | string;
    gameMode?: string;
    spectators: Array<{ id: string; name: string }>;
    password?: string;
}

// ----- Inbound (game-node → lobby) — mirrors game-node OutboundMessage -----

export interface HelloPayload {
    maxGames: number;
    address: string;
    port: number;
    protocol: string;
    version: string;
    protocolVersion: number;
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

export interface GameClosedPayload {
    game: string;
}

export interface GameWinPayload {
    game: GameSaveState;
    winner: string;
    reason: string;
}

export interface PlayerLeftPayload {
    gameId: string;
    game: GameSaveState;
    player: string;
    spectator: boolean;
}

export type InboundMessage =
    | { command: "HELLO"; arg: HelloPayload }
    | { command: "HEARTBEAT" }
    | { command: "PONG" }
    | { command: "GAMEERROR"; arg: GameErrorPayload }
    | { command: "GAMECLOSED"; arg: GameClosedPayload }
    | { command: "GAMEWIN"; arg: GameWinPayload }
    | { command: "PLAYERLEFT"; arg: PlayerLeftPayload };

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

// ----- Inbound validation -----

const INBOUND_COMMANDS: readonly string[] = ["HELLO", "HEARTBEAT", "PONG", "GAMEERROR", "GAMECLOSED", "GAMEWIN", "PLAYERLEFT"];

export function isInboundCommand(command: unknown): command is InboundCommand {
    return typeof command === "string" && INBOUND_COMMANDS.includes(command);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
    return value === undefined || typeof value === "string";
}

function isDate(value: unknown): value is Date | string {
    return typeof value === "string" || value instanceof Date;
}

function isOptionalDate(value: unknown): value is Date | string | undefined {
    return value === undefined || isDate(value);
}

function isPlayerSaveState(value: unknown): value is PlayerSaveState {
    return isRecord(value) && typeof value.name === "string" && typeof value.faction === "string" &&
        typeof value.honor === "number" && typeof value.lostProvinces === "number" && isOptionalString(value.deckId);
}

function isGameSaveState(value: unknown): value is GameSaveState {
    return isRecord(value) && typeof value.gameId === "string" && Array.isArray(value.players) && value.players.every(isPlayerSaveState) &&
        typeof value.roundNumber === "number" && isOptionalString(value.winner) && isOptionalString(value.winReason) &&
        isOptionalString(value.gameMode) && isOptionalDate(value.startedAt) && isOptionalDate(value.finishedAt) &&
        (value.initialFirstPlayer === null || isOptionalString(value.initialFirstPlayer));
}

function isPlayerSummary(value: unknown): value is PlayerSummary {
    return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.owner === "boolean" &&
        isRecord(value.deck) && isOptionalString(value.emailHash) && isOptionalString(value.faction);
}

function isSpectatorSummary(value: unknown): value is { id: string; name: string } {
    return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}

export function isGameSummary(value: unknown): value is GameSummary {
    return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.owner === "string" &&
        typeof value.allowSpectators === "boolean" && typeof value.manualMode === "boolean" && typeof value.started === "boolean" &&
        isDate(value.createdAt) && isOptionalDate(value.startedAt) && isOptionalString(value.gameType) &&
        isOptionalString(value.gameMode) && isOptionalString(value.password) &&
        isRecord(value.players) && Object.values(value.players).every(isPlayerSummary) &&
        Array.isArray(value.spectators) && value.spectators.every(isSpectatorSummary);
}

function isHelloPayload(value: unknown): value is HelloPayload {
    return isRecord(value) && typeof value.maxGames === "number" && typeof value.address === "string" &&
        typeof value.port === "number" && typeof value.protocol === "string" && typeof value.version === "string" &&
        typeof value.protocolVersion === "number" && Array.isArray(value.games) && value.games.every(isGameSummary);
}

function isGameErrorPayload(value: unknown): value is GameErrorPayload {
    return isRecord(value) && typeof value.gameId === "string" && typeof value.gameName === "string" &&
        Array.isArray(value.players) && value.players.every(player => typeof player === "string") &&
        typeof value.errorMessage === "string" && isOptionalString(value.errorStack) && typeof value.timestamp === "string";
}

function isGameClosedPayload(value: unknown): value is GameClosedPayload {
    return isRecord(value) && typeof value.game === "string";
}

function isGameWinPayload(value: unknown): value is GameWinPayload {
    return isRecord(value) && isGameSaveState(value.game) && typeof value.winner === "string" && typeof value.reason === "string";
}

function isPlayerLeftPayload(value: unknown): value is PlayerLeftPayload {
    return isRecord(value) && typeof value.gameId === "string" && isGameSaveState(value.game) &&
        typeof value.player === "string" && typeof value.spectator === "boolean";
}

// Returns null for an unknown command or a payload that doesn't match its command.
export function parseInbound(raw: unknown): InboundMessage | null {
    if(!isRecord(raw)) {
        return null;
    }
    const arg = raw.arg;
    switch(raw.command) {
        case "HEARTBEAT":
            return { command: "HEARTBEAT" };
        case "PONG":
            return { command: "PONG" };
        case "HELLO":
            return isHelloPayload(arg) ? { command: "HELLO", arg } : null;
        case "GAMEERROR":
            return isGameErrorPayload(arg) ? { command: "GAMEERROR", arg } : null;
        case "GAMECLOSED":
            return isGameClosedPayload(arg) ? { command: "GAMECLOSED", arg } : null;
        case "GAMEWIN":
            return isGameWinPayload(arg) ? { command: "GAMEWIN", arg } : null;
        case "PLAYERLEFT":
            return isPlayerLeftPayload(arg) ? { command: "PLAYERLEFT", arg } : null;
        default:
            return null;
    }
}
