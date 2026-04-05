// Redux store types

import type { GameState, OnlineUser } from "./game";
import type { AuthState, UserState } from "./user";
import type { CardsState } from "./deck";

export interface NavigationState {
    path?: string;
    search?: string;
    context?: any;
}

export interface GamesState {
    games: any[];
    currentGame?: GameState;
    newGame?: boolean;
    users?: OnlineUser[];
    passwordGame?: any;
    passwordJoinType?: string;
    passwordError?: string;
    gameStats?: any;
    gameId?: string;
}

export interface SocketState {
    socket?: any;
    gameSocket?: any;
    gameConnecting?: boolean;
    gameHost?: string;
}

export interface ChatState {
    notice?: string;
}

export interface NewsState {
    news?: any[];
    newsSaved?: boolean;
}

export interface ApiState {
    loading?: boolean;
    loadingCount?: number;
    status?: number;
    message?: string;
}

export interface AdminState {
    currentUser?: any;
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
}
