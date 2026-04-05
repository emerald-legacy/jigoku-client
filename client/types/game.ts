// Core game types used across the client

export interface CardToken {
    [key: string]: number;
}

export interface MenuItem {
    text: string;
    command: string;
    arg?: string;
    disabled?: boolean;
    method?: string;
}

export interface Card {
    uuid: string;
    id: string;
    name: string;
    facedown: boolean;
    type?: string;
    element?: string;
    label?: string;
    packId?: string;
    tokens?: CardToken;
    menu?: MenuItem[];
    attached?: boolean;
    selected?: boolean;
    selectable?: boolean;
    inConflict?: boolean;
    bowed?: boolean;
    covert?: boolean;
    new?: boolean;
    fate?: number;
    location?: string;
    controlled?: boolean;
    attachments?: Card[];
    isDishonored?: boolean;
    isHonored?: boolean;
    isTainted?: boolean;
    controller?: string;
    popupCards?: Card[];
    group?: string;
}

export interface Ring {
    element: string;
    fate: number;
    claimed: boolean;
    claimedBy?: string;
    contested?: boolean;
    menu?: MenuItem[];
    conflictType?: string;
    tokens?: CardToken;
}

export interface PlayerCardPiles {
    hand: Card[];
    conflictDeck: Card[];
    dynastyDeck: Card[];
    conflictDiscardPile: Card[];
    dynastyDiscardPile: Card[];
    removedFromGame: Card[];
    [key: string]: Card[];
}

export interface Player {
    name: string;
    faction?: {
        name: string;
        value: string;
    };
    user?: {
        emailHash?: string;
        name?: string;
        noAvatar?: boolean;
        settings?: UserSettings;
    };
    stats?: Record<string, number>;
    cardPiles: PlayerCardPiles;
    provinces: {
        one: Card[];
        two: Card[];
        three: Card[];
        four: Card[];
    };
    strongholdProvince?: Card[];
    clock?: ClockState;
    promptedActionWindows?: Record<string, boolean>;
    timerSettings?: Record<string, any>;
    optionSettings?: Record<string, any>;
    imperialFavor?: string;
    firstPlayer?: boolean;
    left?: boolean;
    numConflictCards?: number;
    numDynastyCards?: number;
    conflictDeckTopCard?: Card | null;
    dynastyDeckTopCard?: Card | null;
    hideProvinceDeck?: boolean;
    role?: Card | null;
    showBid?: number;
    buttons?: Button[];
    menuTitle?: string;
    promptTitle?: string;
    promptType?: string;
    selectCard?: boolean;
    selectOrder?: boolean;
    selectRing?: boolean;
    phase?: string;
    controls?: Control[];
    additionalPiles?: Record<string, { cards: Card[]; title?: string }>;
}

export interface Button {
    text: string;
    arg?: string;
    command?: string;
    card?: Card;
    disabled?: boolean;
    method?: string;
    timer?: number;
}

export interface Control {
    type: string;
    source: string;
    targets: string[];
}

export interface ClockState {
    mode: string;
    timeLeft: number;
    mainTime: number;
    periods: number;
    periodTime: number;
    manuallyPaused?: boolean;
    name?: string;
    delayToStartClock?: number;
}

export interface Spectator {
    name: string;
    emailHash?: string;
    noAvatar?: boolean;
}

export interface MessageFragment {
    name?: string;
    argType?: string;
    message?: MessageFragment[] | string;
    alert?: {
        type: string;
        message: string[];
    };
    [key: string]: any;
}

export interface GameMessage {
    message: MessageFragment[];
    timestamp?: number;
}

export interface GameState {
    id: string;
    name: string;
    started: boolean;
    gameMode?: string;
    players: Record<string, Player>;
    spectators: Spectator[];
    messages: GameMessage[];
    newMessages?: GameMessage[];
    winner?: string;
    finishedAt?: string;
    rings?: Record<string, Ring>;
    conflictDeclared?: boolean;
    phase?: string;
    manualMode?: boolean;
    skirmishMode?: boolean;
}

export interface UserSettings {
    cardSize?: string;
    background?: string;
    optionSettings?: Record<string, any>;
    promptedActionWindows?: Record<string, boolean>;
    timerSettings?: Record<string, any>;
}

export interface OnlineUser {
    name: string;
    emailHash?: string;
    noAvatar?: boolean;
}
