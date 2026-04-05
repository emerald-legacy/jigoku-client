import axios from "axios";
import validateDeck from "../deck-validator";

export function loadDecks(format: string | null = null) {
    return {
        types: ["REQUEST_DECKS", "RECEIVE_DECKS"] as const,
        shouldCallAPI: (state: any) => {
            // Always refetch if format is specified (for PendingGame filtering)
            // or if we only have a single deck loaded, or if decks haven't been loaded yet
            return format !== null || state.cards.singleDeck || !state.cards.decks;
        },
        callAPI: async () => {
            const url = format ? `/api/decks?format=${format}` : "/api/decks";
            const response = await axios.get(url);

            if(response.data.decks && response.data.decks.length > 0) {
                const validationPromises = response.data.decks.map(async (deck: any) => {
                    const gameMode = deck.format && deck.format.value ? deck.format.value : "stronghold";
                    try {
                        const status = await validateDeck(deck, { includeExtendedStatus: true, gameMode });
                        deck.status = status;
                        return deck;
                    } catch(error) {
                        deck.status = {
                            valid: undefined,
                            extendedStatus: ["Error Validating"]
                        };
                        return deck;
                    }
                });

                await Promise.all(validationPromises);
            }

            return response.data;
        }
    };
}

export function loadDeck(deckId: string) {
    return {
        types: ["REQUEST_DECK", "RECEIVE_DECK"] as const,
        shouldCallAPI: (state: any) => {
            return !state.cards.decks?.some((deck: any) => deck._id === deckId);
        },
        callAPI: async () => {
            const response = await axios.get(`/api/decks/${deckId}`);

            if(response.data.deck) {
                const gameMode = response.data.deck.format && response.data.deck.format.value ? response.data.deck.format.value : "stronghold";
                try {
                    const status = await validateDeck(response.data.deck, { includeExtendedStatus: true, gameMode });
                    response.data.deck.status = status;
                } catch(error) {
                    response.data.deck.status = {
                        valid: undefined,
                        extendedStatus: ["Error Validating"]
                    };
                }
            }

            return response.data;
        }
    };
}

export function selectDeck(deck: any) {
    return {
        type: "SELECT_DECK" as const,
        deck: deck
    };
}

export function addDeck() {
    return {
        type: "ADD_DECK" as const
    };
}

export function updateDeck(deck: any) {
    return {
        type: "UPDATE_DECK" as const,
        deck: deck
    };
}

export function updateDeckStatus(deckId: string, status: any) {
    return {
        type: "UPDATE_DECK_STATUS" as const,
        deckId: deckId,
        status: status
    };
}

export function deleteDeck(deck: any) {
    return {
        types: ["DELETE_DECK", "DECK_DELETED"] as const,
        shouldCallAPI: () => true,
        callAPI: () => axios.delete(`/api/decks/${deck._id}`).then(r => r.data)
    };
}

export function deleteDecks(deckIds: string[]) {
    return {
        types: ["DELETE_DECKS", "DECKS_DELETED"] as const,
        shouldCallAPI: () => true,
        callAPI: () => axios.post("/api/decks/delete-batch", { deckIds }).then(r => r.data)
    };
}

export function saveDeck(deck: any) {
    const str = JSON.stringify({
        deckName: deck.name,
        faction: { name: deck.faction.name, value: deck.faction.value },
        alliance: { name: deck.alliance.name, value: deck.alliance.value },
        format: { name: deck.format.name, value: deck.format.value },
        stronghold: formatCards(deck.stronghold),
        role: formatCards(deck.role),
        provinceCards: formatCards(deck.provinceCards),
        conflictCards: formatCards(deck.conflictCards),
        dynastyCards: formatCards(deck.dynastyCards)
    });

    return {
        types: ["SAVE_DECK", "DECK_SAVED"] as const,
        shouldCallAPI: () => true,
        callAPI: () => {
            const url = `/api/decks/${deck._id || ""}`;
            const method: "put" | "post" = deck._id ? "put" : "post";
            return axios[method](url, { data: str }).then(r => r.data);
        }
    };
}

export function clearDeckStatus() {
    return {
        type: "CLEAR_DECK_STATUS" as const
    };
}

export function loadDecksWithLazyValidation() {
    return async (dispatch: any) => {
        dispatch({ type: "REQUEST_DECKS" });

        try {
            const response = await axios.get("/api/decks");

            dispatch({
                type: "RECEIVE_DECKS_UNVALIDATED",
                decks: response.data.decks
            });

            if(response.data.decks && response.data.decks.length > 0) {
                validateDecksInBatches(response.data.decks, dispatch);
            }
        } catch(error: any) {
            dispatch({
                type: "RECEIVE_DECKS",
                success: false,
                message: error.message || "Failed to load decks"
            });
        }
    };
}

async function validateDecksInBatches(decks: any[], dispatch: any, batchSize = 10) {
    for(let i = 0; i < decks.length; i += batchSize) {
        const batch = decks.slice(i, i + batchSize);

        const validationPromises = batch.map(async (deck: any) => {
            const gameMode = deck.format && deck.format.value ? deck.format.value : "stronghold";
            try {
                const status = await validateDeck(deck, { includeExtendedStatus: true, gameMode });
                return { deckId: deck._id, status };
            } catch(error) {
                return {
                    deckId: deck._id,
                    status: { valid: undefined, extendedStatus: ["Error Validating"] }
                };
            }
        });

        const results = await Promise.all(validationPromises);

        dispatch({
            type: "UPDATE_DECKS_VALIDATION",
            validations: results
        });

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    dispatch({ type: "DECKS_VALIDATION_COMPLETE" });
}

function formatCards(cards: any[]) {
    return cards.map(card => ({
        card: { id: card.card.id },
        count: card.count,
        pack_id: card.pack_id
    }));
}
