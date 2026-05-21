import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Card } from "../types/game";
import type { CardsState, Deck, DeckCard, DeckStatus, Faction, Format, Pack } from "../types/deck";
import { loadCards, loadPacks, loadFactions, loadFormats } from "../ReduxActions/cards";
import { loadDeck, loadDecks, deleteDeck, deleteDecks, saveDeck } from "../ReduxActions/deck";
import { loadDeckStats } from "../ReduxActions/deckstats";
import { addLoadingMatchers } from "./loadingMatchers";

interface DeckValidationUpdate {
    deckId: string;
    status: DeckStatus;
}

interface RawDeckCard {
    count: number;
    card: { id: string } | Card;
    pack_id?: string;
}

type RawDeck = Omit<Deck, "stronghold" | "role" | "provinceCards" | "conflictCards" | "dynastyCards"> & {
    stronghold?: RawDeckCard[] | DeckCard[];
    role?: RawDeckCard[] | DeckCard[];
    provinceCards?: RawDeckCard[] | DeckCard[];
    conflictCards?: RawDeckCard[] | DeckCard[];
    dynastyCards?: RawDeckCard[] | DeckCard[];
};

function applySelectDeck(state: CardsState, deck: Deck | undefined): void {
    if(state.decks && state.decks.length !== 0) {
        state.selectedDeck = deck;
    } else {
        state.selectedDeck = undefined;
    }
}

const DECK_LIST_KEYS = ["stronghold", "role", "provinceCards", "conflictCards", "dynastyCards"] as const;

function processDeck(rawDeck: RawDeck, state: CardsState): Deck {
    if(!state.cards || !rawDeck.faction) {
        return rawDeck as Deck;
    }
    const deck: Deck = { ...(rawDeck as Deck) };
    const factions = state.factions ?? {};
    if(rawDeck.faction) {
        deck.faction = factions[rawDeck.faction.value];
    }
    if(deck.alliance) {
        if(deck.alliance.value === "") {
            deck.alliance = { name: "", value: "" };
        } else {
            deck.alliance = factions[deck.alliance.value];
        }
    }
    const cards = state.cards;
    for(const key of DECK_LIST_KEYS) {
        const list = (rawDeck as unknown as Record<string, RawDeckCard[] | undefined>)[key];
        if(list) {
            const mapped: DeckCard[] = list
                .filter((card) => !!card.card)
                .map((card) => ({
                    count: card.count,
                    card: cards[card.card.id],
                    pack_id: card.pack_id
                }));
            (deck as unknown as Record<string, DeckCard[]>)[key] = mapped;
        }
    }
    return deck;
}

function processDecks(decks: RawDeck[], state: CardsState): Deck[] {
    return decks.map(deck => processDeck(deck, state));
}

const cardsSlice = createSlice({
    name: "cards",
    initialState: {} as CardsState,
    reducers: {
        zoomCard(state, action: PayloadAction<Card | undefined>) {
            state.zoomCard = action.payload;
        },
        clearZoom(state) {
            state.zoomCard = undefined;
        },
        selectDeck(state, action: PayloadAction<Deck | undefined>) {
            state.deckSaved = false;
            state.selectedDeck = action.payload ? processDeck(action.payload, state) : action.payload;
        },
        addDeck(state) {
            state.deckSaved = false;
            state.selectedDeck = processDeck({ name: "New Deck" }, state);
        },
        updateDeck(state, action: PayloadAction<Deck | undefined>) {
            state.deckSaved = false;
            state.selectedDeck = action.payload ? processDeck(action.payload, state) : action.payload;
        },
        updateDeckStatus: {
            reducer(state, action: PayloadAction<{ deckId: string; status: DeckStatus }>) {
                const { deckId, status } = action.payload;
                if(state.decks) {
                    state.decks = state.decks.map((deck: Deck) =>
                        deck._id === deckId ? { ...deck, status } : deck
                    );
                }
                if(state.selectedDeck && state.selectedDeck._id === deckId) {
                    state.selectedDeck = { ...state.selectedDeck, status };
                }
            },
            prepare(deckId: string, status: DeckStatus) {
                return { payload: { deckId, status } };
            }
        },
        clearDeckStatus(state) {
            state.deckDeleted = false;
            state.deckSaved = false;
        },
        receiveDecksUnvalidated(state, action: PayloadAction<RawDeck[]>) {
            state.singleDeck = false;
            state.decks = processDecks(action.payload, state);
            state.decksValidating = true;
            applySelectDeck(state, state.decks[0]);
        },
        updateDecksValidation(state, action: PayloadAction<DeckValidationUpdate[]>) {
            if(state.decks) {
                state.decks = state.decks.map((deck: Deck) => {
                    const validation = action.payload.find((v) => v.deckId === deck._id);
                    return validation ? { ...deck, status: validation.status } : deck;
                });
            }
            if(state.selectedDeck) {
                const selectedId = state.selectedDeck._id;
                const validation = action.payload.find((v) => v.deckId === selectedId);
                if(validation) {
                    state.selectedDeck = { ...state.selectedDeck, status: validation.status };
                }
            }
        },
        decksValidationComplete(state) {
            state.decksValidating = false;
        },
        prepareDecksLoad(state) {
            state.deckSaved = false;
            state.deckDeleted = false;
            if(state.selectedDeck && !state.selectedDeck._id) {
                if(state.decks && state.decks.length > 0) {
                    state.selectedDeck = state.decks[0];
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadCards.fulfilled, (state: CardsState, action: PayloadAction<{ cards: Record<string, Card> }>) => {
                const agendas: Record<string, Card> = {};
                Object.values(action.payload.cards).forEach((card: Card & { pack_code?: string }) => {
                    if(card.type === "agenda" && card.pack_code !== "VDS") {
                        agendas[card.id] = card;
                    }
                });
                state.cards = action.payload.cards;
                state.agendas = agendas;
                state.banners = Object.values(agendas).filter((card: Card) =>
                    !!card.label && card.label.startsWith("Banner of the")
                );
            })
            .addCase(loadPacks.fulfilled, (state: CardsState, action: PayloadAction<{ packs: Pack[] }>) => {
                state.packs = action.payload.packs;
            })
            .addCase(loadFactions.fulfilled, (state: CardsState, action: PayloadAction<{ factions: Faction[] }>) => {
                const factions: Record<string, Faction> = {};
                action.payload.factions.forEach((faction: Faction) => {
                    factions[faction.value] = faction;
                });
                state.factions = factions;
            })
            .addCase(loadFormats.fulfilled, (state: CardsState, action: PayloadAction<{ formats: Format[] }>) => {
                const formats: Record<string, Format> = {};
                action.payload.formats.forEach((format: Format) => {
                    formats[format.value] = format;
                });
                state.formats = formats;
            })
            .addCase(loadDeck.pending, (state: CardsState) => {
                state.deckSaved = false;
                state.deckDeleted = false;
            })
            .addCase(loadDecks.pending, (state: CardsState) => {
                state.deckSaved = false;
                state.deckDeleted = false;
                if(state.selectedDeck && !state.selectedDeck._id) {
                    if(state.decks && state.decks.length > 0) {
                        state.selectedDeck = state.decks[0];
                    }
                }
            })
            .addCase(loadDecks.fulfilled, (state: CardsState, action: PayloadAction<{ decks?: Deck[] } | undefined>) => {
                if(!action.payload || !action.payload.decks) {
                    return;
                }
                state.singleDeck = false;
                state.decks = processDecks(action.payload.decks, state);
                applySelectDeck(state, state.decks[0]);
            })
            .addCase(loadDeck.fulfilled, (state: CardsState, action: PayloadAction<{ deck: Deck }>) => {
                state.singleDeck = true;
                state.deckSaved = false;
                const processed = processDeck(action.payload.deck, state);
                if(!state.decks) {
                    state.decks = [];
                }
                if(!state.decks.some((deck: Deck) => deck._id === processed._id)) {
                    state.decks.push(processed);
                }
                const selected = state.decks.find((deck: Deck) => deck._id === processed._id);
                applySelectDeck(state, selected);
            })
            .addCase(saveDeck.pending, (state: CardsState) => {
                state.deckSaved = false;
            })
            .addCase(saveDeck.fulfilled, (state: CardsState) => {
                state.deckSaved = true;
                state.decks = undefined;
                state.deckStats = undefined;
            })
            .addCase(deleteDeck.fulfilled, (state: CardsState, action: PayloadAction<{ deckId: string }>) => {
                state.deckDeleted = true;
                if(state.decks) {
                    state.decks = state.decks.filter((deck: Deck) => deck._id !== action.payload.deckId);
                }
                if(state.deckStats) {
                    delete state.deckStats[action.payload.deckId];
                }
                state.selectedDeck = state.decks ? state.decks[0] : undefined;
            })
            .addCase(deleteDecks.fulfilled, (state: CardsState, action: PayloadAction<{ deckIds: string[] }>) => {
                state.deckDeleted = true;
                if(state.decks) {
                    state.decks = state.decks.filter((deck: Deck) => !!deck._id && !action.payload.deckIds.includes(deck._id));
                }
                if(state.deckStats) {
                    for(const id of action.payload.deckIds) {
                        delete state.deckStats[id];
                    }
                }
                state.selectedDeck = state.decks ? state.decks[0] : undefined;
            })
            .addCase(loadDeckStats.fulfilled, (state: CardsState, action: PayloadAction<{ stats?: Record<string, DeckStatus> } | undefined>) => {
                if(!action.payload || !action.payload.stats) {
                    return;
                }
                state.deckStats = action.payload.stats;
            });
        addLoadingMatchers(builder, "cards");
    }
});

export const {
    zoomCard, clearZoom, selectDeck, addDeck, updateDeck, updateDeckStatus,
    clearDeckStatus, receiveDecksUnvalidated, updateDecksValidation, decksValidationComplete,
    prepareDecksLoad
} = cardsSlice.actions;
export default cardsSlice.reducer;
