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
    isToken?: boolean;
    facedownId?: string;
    facedownPackId?: string;
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
    showPopup?: boolean;
    isProvince?: boolean;
    isDynasty?: boolean;
    isConflict?: boolean;
    isStronghold?: boolean;
    isBroken?: boolean;
    inDanger?: boolean;
    saved?: boolean;
    unselectable?: boolean;
    abilityLimits?: any;
    strengthSummary?: any;
    militarySkillSummary?: any;
    politicalSkillSummary?: any;
    glorySummary?: any;
    childCards?: Card[];
    order?: number;
    code?: string;
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
    removedFromGame?: boolean;
    selected?: boolean;
    unselectable?: boolean;
    type?: string;
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
        username?: string;
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
    disconnected?: boolean;
    deck?: { selected?: boolean; status?: any; name?: string };
    id?: string;
    cardsPlayedThisConflict?: number;
}

export interface Button {
    text: string;
    arg?: string;
    command?: string;
    card?: Card;
    disabled?: boolean;
    method?: string;
    timer?: number;
    uuid?: string;
    timerCancel?: boolean;
}

export interface Control {
    type: string;
    source: string;
    targets: string[];
    command?: string;
    uuid?: string;
    method?: string;
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
    conflict?: any;
    phase?: string;
    manualMode?: boolean;
    skirmishMode?: boolean;
}

export interface UserSettings {
    cardSize?: string;
    background?: string;
    disableGravatar?: boolean;
    optionSettings?: Record<string, any>;
    promptedActionWindows?: Record<string, boolean>;
    timerSettings?: Record<string, any>;
    windowTimer?: number;
}

export interface OnlineUser {
    name: string;
    emailHash?: string;
    noAvatar?: boolean;
}
