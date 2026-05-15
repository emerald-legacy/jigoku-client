import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CardsState } from "../types/deck";

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
            processDecks(action.payload, state);
            state.singleDeck = false;
            state.decks = action.payload;
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
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase("RECEIVE_CARDS", (state: CardsState, action: any) => {
                const agendas: Record<string, any> = {};
                Object.values(action.response.cards).forEach((card: any) => {
                    if(card.type === "agenda" && card.pack_code !== "VDS") {
                        agendas[card.id] = card;
                    }
                });
                state.cards = action.response.cards;
                state.agendas = agendas;
                state.banners = Object.values(agendas).filter((card: any) =>
                    card.label.startsWith("Banner of the")
                );
            })
            .addCase("RECEIVE_PACKS", (state: CardsState, action: any) => {
                state.packs = action.response.packs;
            })
            .addCase("RECEIVE_FACTIONS", (state: CardsState, action: any) => {
                const factions: Record<string, any> = {};
                action.response.factions.forEach((faction: any) => {
                    factions[faction.value] = faction;
                });
                state.factions = factions;
            })
            .addCase("RECEIVE_FORMATS", (state: CardsState, action: any) => {
                const formats: Record<string, any> = {};
                action.response.formats.forEach((format: any) => {
                    formats[format.value] = format;
                });
                state.formats = formats;
            })
            .addCase("REQUEST_DECK", (state: CardsState) => {
                state.deckSaved = false;
                state.deckDeleted = false;
            })
            .addCase("REQUEST_DECKS", (state: CardsState) => {
                state.deckSaved = false;
                state.deckDeleted = false;
                if(state.selectedDeck && !state.selectedDeck._id) {
                    if(state.decks && state.decks.length > 0) {
                        state.selectedDeck = state.decks[0];
                    }
                }
            })
            .addCase("RECEIVE_DECKS", (state: CardsState, action: any) => {
                if(!action.response || !action.response.decks) {
                    return;
                }
                state.singleDeck = false;
                state.decks = processDecks(action.response.decks, state);
                applySelectDeck(state, state.decks[0]);
            })
            .addCase("RECEIVE_DECK", (state: CardsState, action: any) => {
                state.singleDeck = true;
                state.deckSaved = false;
                const processed = processDeck(action.response.deck, state);
                if(!state.decks.some((deck: any) => deck._id === processed._id)) {
                    state.decks.push(processed);
                }
                const selected = state.decks.find((deck: any) => deck._id === processed._id);
                applySelectDeck(state, selected);
            })
            .addCase("SAVE_DECK", (state: CardsState) => {
                state.deckSaved = false;
            })
            .addCase("DECK_SAVED", (state: CardsState) => {
                state.deckSaved = true;
                state.decks = undefined;
                state.deckStats = undefined;
            })
            .addCase("DECK_DELETED", (state: CardsState, action: any) => {
                state.deckDeleted = true;
                state.decks = state.decks.filter((deck: any) => deck._id !== action.response.deckId);
                if(state.deckStats) {
                    delete state.deckStats[action.response.deckId];
                }
                state.selectedDeck = state.decks[0];
            })
            .addCase("DECKS_DELETED", (state: CardsState, action: any) => {
                state.deckDeleted = true;
                state.decks = state.decks.filter((deck: any) => !action.response.deckIds.includes(deck._id));
                if(state.deckStats) {
                    for(const id of action.response.deckIds) {
                        delete state.deckStats[id];
                    }
                }
                state.selectedDeck = state.decks[0];
            })
            .addCase("RECEIVE_DECK_STATS", (state: CardsState, action: any) => {
                if(!action.response || !action.response.stats) {
                    return;
                }
                state.deckStats = action.response.stats;
            })
            .addCase("UPDATE_DECKS_VALIDATION", (state: CardsState, action: any) => {
                if(state.decks) {
                    state.decks = state.decks.map((deck: any) => {
                        const validation = action.validations.find((v: any) => v.deckId === deck._id);
                        return validation ? { ...deck, status: validation.status } : deck;
                    });
                }
                if(state.selectedDeck) {
                    const validation = action.validations.find((v: any) => v.deckId === state.selectedDeck._id);
                    if(validation) {
                        state.selectedDeck = { ...state.selectedDeck, status: validation.status };
                    }
                }
            })
            .addCase("DECKS_VALIDATION_COMPLETE", (state: CardsState) => {
                state.decksValidating = false;
            })
            .addCase("RECEIVE_DECKS_UNVALIDATED", (state: CardsState, action: any) => {
                state.singleDeck = false;
                state.decks = processDecks(action.decks, state);
                state.decksValidating = true;
                applySelectDeck(state, state.decks[0]);
            });
    }
});

export const {
    zoomCard, clearZoom, selectDeck, addDeck, updateDeck, updateDeckStatus,
    clearDeckStatus, receiveDecksUnvalidated, updateDecksValidation, decksValidationComplete
} = cardsSlice.actions;
export default cardsSlice.reducer;
