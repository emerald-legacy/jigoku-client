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

export interface AbilityLimit {
    max: number;
    current: number;
    exhausted: boolean;
}

export interface SkillModifier {
    name: string;
    amount: number;
}

export interface SkillSummary {
    stat: number;
    modifiers: SkillModifier[];
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
    controller?: string | { name: string };
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
    abilityLimits?: AbilityLimit[];
    strengthSummary?: SkillSummary;
    militarySkillSummary?: SkillSummary;
    politicalSkillSummary?: SkillSummary;
    glorySummary?: SkillSummary;
    childCards?: Card[];
    order?: number;
    code?: string;
    pendingEffects?: PendingEffect[];
}

export interface PendingEffect {
    source: string;
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
    cardsInPlay?: Card[];
    provinceDeck?: Card[];
    [key: string]: Card[] | undefined;
}

export interface PlayerOptionSettings {
    markCardsUnselectable?: boolean;
    cancelOwnAbilities?: boolean;
    orderForcedAbilities?: boolean;
    confirmOneClick?: boolean;
    disableCardStats?: boolean;
    sortHandByName?: boolean;
    showRingEffects?: boolean;
}

export interface AdditionalPile {
    cards: Card[];
    title?: string;
    isPrivate?: boolean;
    area?: string;
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
    id?: string;
    provinces: {
        one: Card[];
        two: Card[];
        three: Card[];
        four: Card[];
    };
    strongholdProvince?: Card[];
    clock?: ClockState;
    promptedActionWindows?: Record<string, boolean>;
    timerSettings?: Record<string, unknown>;
    optionSettings?: PlayerOptionSettings;
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
    additionalPiles?: Record<string, AdditionalPile>;
    disconnected?: boolean;
    deck?: { selected?: boolean; status?: unknown; name?: string };
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

export interface TargetingDescriptor {
    type?: string;
    name?: string;
    id?: string;
    element?: string;
    isDynasty?: boolean;
    isConflict?: boolean;
    packId?: string;
    facedown?: boolean;
}

export interface TargetingControl {
    type: "targeting";
    source: TargetingDescriptor;
    targets: TargetingDescriptor[];
    command?: string;
    uuid?: string;
    method?: string;
}

export interface CardNameControl {
    type: "card-name";
    source: string;
    targets: string[];
    command?: string;
    uuid?: string;
    method?: string;
}

export type Control = TargetingControl | CardNameControl;

export interface ClockState {
    mode: string;
    timeLeft: number;
    mainTime: number;
    periods: number;
    periodTime: number;
    manuallyPaused?: boolean;
    name?: string;
    delayToStartClock?: number;
    stateId?: string | number;
    timePeriod?: number;
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
    uuid?: string;
    id?: string;
    type?: string;
    label?: string;
    element?: string;
    emailHash?: string;
    noAvatar?: boolean;
    isReactComponent?: boolean;
}

export interface GameMessage {
    message: MessageFragment[];
    timestamp?: number;
}

export interface ConflictInfo {
    attackingPlayerId?: string;
    defendingPlayerId?: string;
    attackerSkill?: number;
    defenderSkill?: number;
    unopposed?: boolean;
    type?: string;
    elements?: string[];
    declarationComplete?: boolean;
    defendersChosen?: boolean;
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
    conflict?: ConflictInfo;
    phase?: string;
    manualMode?: boolean;
    skirmishMode?: boolean;
}

export interface UserSettings {
    cardSize?: string;
    background?: string;
    disableGravatar?: boolean;
    optionSettings?: PlayerOptionSettings;
    promptedActionWindows?: Record<string, boolean>;
    timerSettings?: Record<string, unknown>;
    windowTimer?: number;
}

export interface OnlineUser {
    name: string;
    emailHash?: string;
    noAvatar?: boolean;
}
