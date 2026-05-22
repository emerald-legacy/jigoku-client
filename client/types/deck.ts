// Deck and card collection types

import type { Card } from "./game.js";

export interface DeckCard {
    count: number;
    card: Card;
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
    id?: string;
}

export interface Format {
    name: string;
    value: string;
}

export interface DeckStatus {
    basicRules?: boolean;
    factionRules?: boolean;
    noUnreleasedCards?: boolean;
    officialRole?: boolean;
    provinceCount?: number;
    dynastyCount?: number;
    conflictCount?: number;
    valid?: boolean;
    extendedStatus?: string[];
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
}

export interface CardsState {
    cards?: Record<string, Card>;
    agendas?: Record<string, Card>;
    banners?: Card[];
    packs?: Pack[];
    factions?: Record<string, Faction>;
    formats?: Record<string, Format>;
    decks?: Deck[];
    selectedDeck?: Deck;
    deckStats?: Record<string, DeckStatus>;
    deckSaved?: boolean;
    deckDeleted?: boolean;
    zoomCard?: Card;
    singleDeck?: boolean;
    decksValidating?: boolean;
    loading?: boolean;
}
