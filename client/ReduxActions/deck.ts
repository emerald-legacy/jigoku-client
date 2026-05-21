import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Deck, DeckCard, DeckStatus } from "../types/deck";
import type { RootState } from "../types/redux";
import validateDeck from "../deck-validator";
import type { AppDispatch } from "../hooks";
import { apiCall } from "./apiCall";
import {
    prepareDecksLoad,
    receiveDecksUnvalidated,
    updateDecksValidation,
    decksValidationComplete
} from "../reducers/cards";

export const loadDecks = createAsyncThunk(
    "cards/loadDecks",
    async (format: string | null = null, { rejectWithValue }) => {
        const url = format ? `/api/decks?format=${format}` : "/api/decks";
        const data = await apiCall<{ decks?: Deck[] }>(() => axios.get(url), rejectWithValue);

        if(data && data.decks && data.decks.length > 0) {
            const validationPromises = data.decks.map(async (deck: Deck) => {
                const gameMode = deck.format && deck.format.value ? deck.format.value : "stronghold";
                try {
                    const status = await validateDeck(deck, { includeExtendedStatus: true, gameMode });
                    deck.status = status;
                    return deck;
                } catch(_error) {
                    deck.status = {
                        valid: undefined,
                        extendedStatus: ["Error Validating"]
                    };
                    return deck;
                }
            });
            await Promise.all(validationPromises);
        }

        return data;
    },
    {
        condition: (format, { getState }) => {
            const state = getState() as RootState;
            return format !== null || !!state.cards.singleDeck || !state.cards.decks;
        }
    }
);

export const loadDeck = createAsyncThunk(
    "cards/loadDeck",
    async (deckId: string, { rejectWithValue }) => {
        const data = await apiCall<{ deck: Deck }>(() => axios.get(`/api/decks/${deckId}`), rejectWithValue);

        if(data && data.deck) {
            const gameMode = data.deck.format && data.deck.format.value ? data.deck.format.value : "stronghold";
            try {
                const status = await validateDeck(data.deck, { includeExtendedStatus: true, gameMode });
                data.deck.status = status;
            } catch(_error) {
                data.deck.status = {
                    valid: undefined,
                    extendedStatus: ["Error Validating"]
                };
            }
        }

        return data;
    },
    {
        condition: (deckId, { getState }) => {
            const state = getState() as RootState;
            return !state.cards.decks?.some((deck: Deck) => deck._id === deckId);
        }
    }
);

export const deleteDeck = createAsyncThunk(
    "cards/deleteDeck",
    (deck: Deck, { rejectWithValue }) => apiCall<{ deckId: string }>(() => axios.delete(`/api/decks/${deck._id}`), rejectWithValue)
);

export const deleteDecks = createAsyncThunk(
    "cards/deleteDecks",
    (deckIds: string[], { rejectWithValue }) => apiCall<{ deckIds: string[] }>(() => axios.post("/api/decks/delete-batch", { deckIds }), rejectWithValue)
);

export const saveDeck = createAsyncThunk(
    "cards/saveDeck",
    (deck: Deck, { rejectWithValue }) => {
        const str = JSON.stringify({
            deckName: deck.name,
            faction: deck.faction ? { name: deck.faction.name, value: deck.faction.value } : undefined,
            alliance: deck.alliance ? { name: deck.alliance.name, value: deck.alliance.value } : undefined,
            format: deck.format ? { name: deck.format.name, value: deck.format.value } : undefined,
            stronghold: formatCards(deck.stronghold),
            role: formatCards(deck.role),
            provinceCards: formatCards(deck.provinceCards),
            conflictCards: formatCards(deck.conflictCards),
            dynastyCards: formatCards(deck.dynastyCards)
        });
        const url = `/api/decks/${deck._id || ""}`;
        const method: "put" | "post" = deck._id ? "put" : "post";
        return apiCall(() => axios[method](url, { data: str }), rejectWithValue);
    }
);

export function loadDecksWithLazyValidation() {
    return async (dispatch: AppDispatch) => {
        dispatch(prepareDecksLoad());

        try {
            const response = await axios.get<{ decks: Deck[] }>("/api/decks");
            dispatch(receiveDecksUnvalidated(response.data.decks));

            if(response.data.decks && response.data.decks.length > 0) {
                validateDecksInBatches(response.data.decks, dispatch);
            }
        } catch(_error: unknown) {
            // Lazy load fails silently; user can refresh.
        }
    };
}

async function validateDecksInBatches(decks: Deck[], dispatch: AppDispatch, batchSize = 10) {
    for(let i = 0; i < decks.length; i += batchSize) {
        const batch = decks.slice(i, i + batchSize);

        const validationPromises = batch.map(async (deck: Deck) => {
            const gameMode = deck.format && deck.format.value ? deck.format.value : "stronghold";
            try {
                const status = await validateDeck(deck, { includeExtendedStatus: true, gameMode });
                return { deckId: deck._id ?? "", status };
            } catch(_error) {
                return {
                    deckId: deck._id ?? "",
                    status: { valid: undefined as boolean | undefined, extendedStatus: ["Error Validating"] } as DeckStatus
                };
            }
        });

        const results = await Promise.all(validationPromises);
        dispatch(updateDecksValidation(results));

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    dispatch(decksValidationComplete());
}

function formatCards(cards: DeckCard[] | undefined) {
    if(!cards) {
        return [];
    }
    return cards.map((card: DeckCard) => ({
        card: { id: card.card.id },
        count: card.count,
        pack_id: card.pack_id
    }));
}
