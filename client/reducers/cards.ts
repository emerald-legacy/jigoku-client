import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CardsState } from "../types/deck";
import { loadCards, loadPacks, loadFactions, loadFormats } from "../ReduxActions/cards";
import { loadDeck, loadDecks, deleteDeck, deleteDecks, saveDeck } from "../ReduxActions/deck";
import { loadDeckStats } from "../ReduxActions/deckstats";
import { addLoadingMatchers } from "./loadingMatchers";

function applySelectDeck(state: CardsState, deck: any): void {
    if(state.decks && state.decks.length !== 0) {
        state.selectedDeck = deck;
    } else {
        state.selectedDeck = undefined;
    }
}

const DECK_LIST_KEYS = ["stronghold", "role", "provinceCards", "conflictCards", "dynastyCards"] as const;

function processDeck(rawDeck: any, state: CardsState): any {
    if(!state.cards || !rawDeck.faction) {
        return rawDeck;
    }
    const deck: any = { ...rawDeck };
    deck.faction = state.factions[rawDeck.faction.value];
    if(deck.alliance) {
        if(deck.alliance.value === "") {
            deck.alliance = { name: "", value: "" };
        } else {
            deck.alliance = state.factions[deck.alliance.value];
        }
    }
    for(const key of DECK_LIST_KEYS) {
        if(deck[key]) {
            deck[key] = deck[key]
                .filter((card: any) => !!card.card)
                .map((card: any) => ({
                    count: card.count,
                    card: state.cards[card.card.id],
                    pack_id: card.pack_id
                }));
        }
    }
    return deck;
}

function processDecks(decks: any[], state: CardsState): any[] {
    return decks.map(deck => processDeck(deck, state));
}

const cardsSlice = createSlice({
    name: "cards",
    initialState: {} as CardsState,
    reducers: {
        zoomCard(state, action: PayloadAction<any>) {
            state.zoomCard = action.payload;
        },
        clearZoom(state) {
            state.zoomCard = undefined;
        },
        selectDeck(state, action: PayloadAction<any>) {
            state.deckSaved = false;
            state.selectedDeck = action.payload ? processDeck(action.payload, state) : action.payload;
        },
        addDeck(state) {
            state.deckSaved = false;
            state.selectedDeck = processDeck({ name: "New Deck" }, state);
        },
        updateDeck(state, action: PayloadAction<any>) {
            state.deckSaved = false;
            state.selectedDeck = action.payload ? processDeck(action.payload, state) : action.payload;
        },
        updateDeckStatus: {
            reducer(state, action: PayloadAction<{ deckId: string; status: any }>) {
                const { deckId, status } = action.payload;
                if(state.decks) {
                    state.decks = state.decks.map((deck: any) =>
                        deck._id === deckId ? { ...deck, status } : deck
                    );
                }
                if(state.selectedDeck && state.selectedDeck._id === deckId) {
                    state.selectedDeck = { ...state.selectedDeck, status };
                }
            },
            prepare(deckId: string, status: any) {
                return { payload: { deckId, status } };
            }
        },
        clearDeckStatus(state) {
            state.deckDeleted = false;
            state.deckSaved = false;
        },
        receiveDecksUnvalidated(state, action: PayloadAction<any[]>) {
            state.singleDeck = false;
            state.decks = processDecks(action.payload, state);
            state.decksValidating = true;
            applySelectDeck(state, state.decks[0]);
        },
        updateDecksValidation(state, action: PayloadAction<any[]>) {
            if(state.decks) {
                state.decks = state.decks.map((deck: any) => {
                    const validation = action.payload.find((v: any) => v.deckId === deck._id);
                    return validation ? { ...deck, status: validation.status } : deck;
                });
            }
            if(state.selectedDeck) {
                const validation = action.payload.find((v: any) => v.deckId === state.selectedDeck._id);
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
            .addCase(loadCards.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                const agendas: Record<string, any> = {};
                Object.values(action.payload.cards).forEach((card: any) => {
                    if(card.type === "agenda" && card.pack_code !== "VDS") {
                        agendas[card.id] = card;
                    }
                });
                state.cards = action.payload.cards;
                state.agendas = agendas;
                state.banners = Object.values(agendas).filter((card: any) =>
                    card.label.startsWith("Banner of the")
                );
            })
            .addCase(loadPacks.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                state.packs = action.payload.packs;
            })
            .addCase(loadFactions.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                const factions: Record<string, any> = {};
                action.payload.factions.forEach((faction: any) => {
                    factions[faction.value] = faction;
                });
                state.factions = factions;
            })
            .addCase(loadFormats.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                const formats: Record<string, any> = {};
                action.payload.formats.forEach((format: any) => {
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
            .addCase(loadDecks.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                if(!action.payload || !action.payload.decks) {
                    return;
                }
                state.singleDeck = false;
                state.decks = processDecks(action.payload.decks, state);
                applySelectDeck(state, state.decks[0]);
            })
            .addCase(loadDeck.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                state.singleDeck = true;
                state.deckSaved = false;
                const processed = processDeck(action.payload.deck, state);
                if(!state.decks.some((deck: any) => deck._id === processed._id)) {
                    state.decks.push(processed);
                }
                const selected = state.decks.find((deck: any) => deck._id === processed._id);
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
            .addCase(deleteDeck.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                state.deckDeleted = true;
                state.decks = state.decks.filter((deck: any) => deck._id !== action.payload.deckId);
                if(state.deckStats) {
                    delete state.deckStats[action.payload.deckId];
                }
                state.selectedDeck = state.decks[0];
            })
            .addCase(deleteDecks.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
                state.deckDeleted = true;
                state.decks = state.decks.filter((deck: any) => !action.payload.deckIds.includes(deck._id));
                if(state.deckStats) {
                    for(const id of action.payload.deckIds) {
                        delete state.deckStats[id];
                    }
                }
                state.selectedDeck = state.decks[0];
            })
            .addCase(loadDeckStats.fulfilled, (state: CardsState, action: PayloadAction<any>) => {
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
