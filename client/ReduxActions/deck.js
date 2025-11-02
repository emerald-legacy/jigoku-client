import $ from 'jquery';
import _ from 'underscore';
import validateDeck from '../deck-validator.js';

export function loadDecks(format = null) {
    return {
        types: ['REQUEST_DECKS', 'RECEIVE_DECKS'],
        shouldCallAPI: (state) => {
            return state.cards.singleDeck || !state.cards.decks;
        },
        callAPI: async () => {
            const url = format ? `/api/decks?format=${format}` : '/api/decks';
            const response = await $.ajax(url, { cache: false });

            // Validate all decks after loading
            if(response.decks && response.decks.length > 0) {
                const validationPromises = response.decks.map(async (deck) => {
                    const gameMode = deck.format && deck.format.value ? deck.format.value : 'stronghold';
                    try {
                        const status = await validateDeck(deck, { includeExtendedStatus: true, gameMode });
                        deck.status = status;
                        return deck;
                    } catch(error) {
                        deck.status = {
                            valid: undefined,
                            extendedStatus: ['Error Validating']
                        };
                        return deck;
                    }
                });

                await Promise.all(validationPromises);
            }

            return response;
        }
    };
}

export function loadDeck(deckId) {
    return {
        types: ['REQUEST_DECK', 'RECEIVE_DECK'],
        shouldCallAPI: (state) => {
            let ret = !_.any(state.cards.decks, deck => {
                return deck._id === deckId;
            });

            return ret;
        },
        callAPI: async () => {
            const response = await $.ajax('/api/decks/' + deckId, { cache: false });

            // Validate the deck after loading
            if(response.deck) {
                const gameMode = response.deck.format && response.deck.format.value ? response.deck.format.value : 'stronghold';
                try {
                    const status = await validateDeck(response.deck, { includeExtendedStatus: true, gameMode });
                    response.deck.status = status;
                } catch(error) {
                    response.deck.status = {
                        valid: undefined,
                        extendedStatus: ['Error Validating']
                    };
                }
            }

            return response;
        }
    };
}

export function selectDeck(deck) {
    return {
        type: 'SELECT_DECK',
        deck: deck
    };
}

export function addDeck() {
    return {
        type: 'ADD_DECK'
    };
}

export function updateDeck(deck) {
    return {
        type: 'UPDATE_DECK',
        deck: deck
    };
}

export function updateDeckStatus(deckId, status) {
    return {
        type: 'UPDATE_DECK_STATUS',
        deckId: deckId,
        status: status
    };
}

export function deleteDeck(deck) {
    return {
        types: ['DELETE_DECK', 'DECK_DELETED'],
        shouldCallAPI: () => true,
        callAPI: () => $.ajax({
            url: '/api/decks/' + deck._id,
            type: 'DELETE'
        })
    };
}

export function deleteDecks(deckIds) {
    return {
        types: ['DELETE_DECKS', 'DECKS_DELETED'],
        shouldCallAPI: () => true,
        callAPI: () => $.ajax({
            url: '/api/decks/delete-batch',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ deckIds })
        })
    };
}

export function saveDeck(deck) {
    let str = JSON.stringify({
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
        types: ['SAVE_DECK', 'DECK_SAVED'],
        shouldCallAPI: () => true,
        callAPI: () => $.ajax({
            url: '/api/decks/' + (deck._id || ''),
            type: deck._id ? 'PUT' : 'POST',
            data: { data: str }
        })
    };
}

export function clearDeckStatus() {
    return {
        type: 'CLEAR_DECK_STATUS'
    };
}

// Lazy loading: Load decks first, then validate progressively in batches
export function loadDecksWithLazyValidation() {
    return async (dispatch) => {
        dispatch({ type: 'REQUEST_DECKS' });

        try {
            const response = await $.ajax('/api/decks', { cache: false });

            // Send decks immediately without validation
            dispatch({
                type: 'RECEIVE_DECKS_UNVALIDATED',
                decks: response.decks
            });

            // Start validating in batches (don't await - runs in background)
            if(response.decks && response.decks.length > 0) {
                validateDecksInBatches(response.decks, dispatch);
            }
        } catch(error) {
            dispatch({
                type: 'RECEIVE_DECKS',
                success: false,
                message: error.message || 'Failed to load decks'
            });
        }
    };
}

async function validateDecksInBatches(decks, dispatch, batchSize = 10) {
    for(let i = 0; i < decks.length; i += batchSize) {
        const batch = decks.slice(i, i + batchSize);

        // Validate batch concurrently
        const validationPromises = batch.map(async (deck) => {
            const gameMode = deck.format && deck.format.value ? deck.format.value : 'stronghold';
            try {
                const status = await validateDeck(deck, { includeExtendedStatus: true, gameMode });
                return { deckId: deck._id, status };
            } catch(error) {
                return {
                    deckId: deck._id,
                    status: { valid: undefined, extendedStatus: ['Error Validating'] }
                };
            }
        });

        const results = await Promise.all(validationPromises);

        // Update Redux store with validated batch
        dispatch({
            type: 'UPDATE_DECKS_VALIDATION',
            validations: results
        });

        // Small delay to prevent hammering EmeraldDB API
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Mark validation as complete
    dispatch({ type: 'DECKS_VALIDATION_COMPLETE' });
}

function formatCards(cards) {
    return _.map(cards, card => {
        return { card: { id: card.card.id }, count: card.count };
    });
}
