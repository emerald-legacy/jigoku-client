// Redux store types

import type { GameState, OnlineUser } from "./game.js";
import type { AuthState, UserState, User } from "./user.js";
import type { CardsState } from "./deck.js";

export interface NewsItem {
    _id?: string;
    text: string;
    poster?: string;
    datePublished?: Date | string;
    deleted?: boolean;
}

export interface PendingPlayer {
    name: string;
    user?: User;
    deck?: import("./deck.js").Deck;
    [key: string]: unknown;
}

export interface PendingGameInfo {
    id?: string;
    name?: string;
    owner?: string;
    started?: boolean;
    gameType?: string;
    gameFormat?: string;
    gameMode?: string;
    allowSpectators?: boolean;
    players?: Record<string, PendingPlayer>;
    spectators?: Record<string, PendingPlayer>;
    node?: string;
    createdAt?: string;
    [key: string]: unknown;
}

export type CardAnimationEvent = { type: "water" | "fire" | "void"; targetUuid: string; effect: string };
export type PlayerAnimationEvent = { type: "earth" | "air"; playerName: string; effect: string };
export type HonorAnimationEvent = { type: "honor"; playerName: string; amount: number };
export type FateAnimationEvent = { type: "fate"; playerName: string; amount: number };

export type AnimationEvent = CardAnimationEvent | PlayerAnimationEvent | HonorAnimationEvent | FateAnimationEvent;

export function isCardAnimation(a: AnimationEvent): a is CardAnimationEvent {
    return a.type === "water" || a.type === "fire" || a.type === "void";
}

export interface NavigationState {
    context?: { x: number; y: number; menuId?: string } | undefined;
}

export interface GamesState {
    games: PendingGameInfo[];
    currentGame?: GameState;
    newGame?: boolean;
    users?: OnlineUser[];
    passwordGame?: PendingGameInfo;
    passwordJoinType?: string;
    passwordError?: string;
    gameStats?: Record<string, unknown>;
    gameId?: string;
    pendingAnimations?: AnimationEvent[];
}

export interface SocketState {
    connected?: boolean;
    gameConnected?: boolean;
    gameConnecting?: boolean;
    gameHost?: string;
}

export interface ChatState {
    notice?: string;
}

export interface NewsState {
    news?: NewsItem[];
    newsSaved?: boolean;
    loading?: boolean;
}

export interface GameErrorSummary {
    _id: string;
    gameId: string;
    gameName?: string;
    players: string[];
    errorMessage: string;
    errorStack?: string;
    timestamp: string;
}

export interface GameErrorRecord extends GameErrorSummary {
    debugData: unknown;
}

export interface GameErrorsState {
    errors?: GameErrorSummary[];
    current?: GameErrorRecord;
    loading?: boolean;
}

export interface ApiState {
    loading?: boolean;
    loadingCount?: number;
    status?: number;
    message?: string;
}

export interface AdminState {
    currentUser?: User;
    userSaved?: boolean;
    loading?: boolean;
}

export interface RootState {
    navigation: NavigationState;
    auth: AuthState;
    cards: CardsState;
    games: GamesState;
    socket: SocketState;
    chat: ChatState;
    news: NewsState;
    api: ApiState;
    admin: AdminState;
    user: UserState;
    serverVersion: import("../reducers/serverVersion.js").ServerVersionState;
    gameErrors: GameErrorsState;
}
