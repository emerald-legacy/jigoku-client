// Deck and card collection types

export interface DeckCard {
    count: number;
    card: import("./game").Card;
    pack_id?: string;
}

export interface Faction {
    name: string;
    value: string;
}

export interface Pack {
    _id: string;
    name: string;
    code: string;
}

export interface Format {
    name: string;
    value: string;
}

export interface DeckStatus {
    basicRules: boolean;
    factionRules: boolean;
    noUnreleasedCards: boolean;
    officialRole: boolean;
    provinceCount?: number;
    dynastyCount?: number;
    conflictCount?: number;
}

export interface Deck {
    _id?: string;
    name: string;
    faction?: Faction;
    alliance?: Faction;
    stronghold?: DeckCard[];
    role?: DeckCard[];
    provinceCards?: DeckCard[];
    conflictCards?: DeckCard[];
    dynastyCards?: DeckCard[];
    format?: Format;
    status?: DeckStatus;
    lastUpdated?: string;
}

export interface CardsState {
    cards?: Record<string, any>;
    agendas?: Record<string, any>;
    banners?: any[];
    packs?: Pack[];
    factions?: Record<string, Faction>;
    formats?: Record<string, Format>;
    decks?: Deck[];
    selectedDeck?: Deck;
    deckStats?: Record<string, any>;
    deckSaved?: boolean;
    deckDeleted?: boolean;
    zoomCard?: any;
    singleDeck?: boolean;
    decksValidating?: boolean;
}
