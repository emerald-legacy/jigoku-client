import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CardsState } from "../types/deck";

function applySelectDeck(state: CardsState, deck: any): void {
    if(state.decks && state.decks.length !== 0) {
        state.selectedDeck = deck;
    } else {
        state.selectedDeck = undefined;
    }
}

function processDecks(decks: any[], state: CardsState): void {
    decks.forEach(deck => {
        if(!state.cards || !deck.faction) {
            return;
        }
        deck.faction = state.factions[deck.faction.value];
        if(deck.alliance) {
            if(deck.alliance.value === "") {
                deck.alliance = { name: "", value: "" };
            } else {
                deck.alliance = state.factions[deck.alliance.value];
            }
        }

        if(deck.stronghold) {
            deck.stronghold = deck.stronghold.filter((card: any) => !!card.card);
        }
        if(deck.role) {
            deck.role = deck.role.filter((card: any) => !!card.card);
        }
        if(deck.provinceCards) {
            deck.provinceCards = deck.provinceCards.filter((card: any) => !!card.card);
        }
        if(deck.conflictCards) {
            deck.conflictCards = deck.conflictCards.filter((card: any) => !!card.card);
        }
        if(deck.dynastyCards) {
            deck.dynastyCards = deck.dynastyCards.filter((card: any) => !!card.card);
        }

        if(deck.stronghold) {
            deck.stronghold = deck.stronghold.map((card: any) => ({
                count: card.count, card: state.cards[card.card.id], pack_id: card.pack_id
            }));
        }
        if(deck.role) {
            deck.role = deck.role.map((card: any) => ({
                count: card.count, card: state.cards[card.card.id], pack_id: card.pack_id
            }));
        }
        if(deck.provinceCards) {
            deck.provinceCards = deck.provinceCards.map((card: any) => ({
                count: card.count, card: state.cards[card.card.id], pack_id: card.pack_id
            }));
        }
        if(deck.conflictCards) {
            deck.conflictCards = deck.conflictCards.map((card: any) => ({
                count: card.count, card: state.cards[card.card.id], pack_id: card.pack_id
            }));
        }
        if(deck.dynastyCards) {
            deck.dynastyCards = deck.dynastyCards.map((card: any) => ({
                count: card.count, card: state.cards[card.card.id], pack_id: card.pack_id
            }));
        }
    });
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
            state.selectedDeck = action.payload;
            state.deckSaved = false;
            if(state.selectedDeck) {
                processDecks([state.selectedDeck], state);
            }
        },
        addDeck(state) {
            const newDeck: any = { name: "New Deck" };
            state.selectedDeck = newDeck;
            state.deckSaved = false;
            processDecks([state.selectedDeck], state);
        },
        updateDeck(state, action: PayloadAction<any>) {
            state.selectedDeck = action.payload;
            state.deckSaved = false;
            if(state.selectedDeck) {
                processDecks([state.selectedDeck], state);
            }
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
                processDecks(action.response.decks, state);
                state.singleDeck = false;
                state.decks = action.response.decks;
                applySelectDeck(state, state.decks[0]);
            })
            .addCase("RECEIVE_DECK", (state: CardsState, action: any) => {
                state.singleDeck = true;
                state.deckSaved = false;
                processDecks([action.response.deck], state);
                if(!state.decks.some((deck: any) => deck._id === action.response.deck._id)) {
                    state.decks.push(action.response.deck);
                }
                const selected = state.decks.find((deck: any) => deck._id === action.response.deck._id);
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
                processDecks(action.decks, state);
                state.singleDeck = false;
                state.decks = action.decks;
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
