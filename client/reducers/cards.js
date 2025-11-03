import _ from 'underscore';

function selectDeck(state, deck) {
    if(state.decks && state.decks.length !== 0) {
        state.selectedDeck = deck;
    } else {
        delete state.selectedDeck;
    }

    return state;
}

function processDecks(decks, state) {
    _.each(decks, deck => {
        if(!state.cards || !deck.faction) {
            return;
        }
        deck.faction = state.factions[deck.faction.value];
        if(deck.alliance) {
            if(deck.alliance.value === '') {
                deck.alliance = { name: '', value: '' };
            } else {
                deck.alliance = state.factions[deck.alliance.value];
            }
        }

        if(deck.stronghold) {
            deck.stronghold = deck.stronghold.filter(card => !!card.card);
        }
        if(deck.role) {
            deck.role = deck.role.filter(card => !!card.card);
        }
        if(deck.provinceCards) {
            deck.provinceCards = deck.provinceCards.filter(card => !!card.card);
        }
        if(deck.conflictCards) {
            deck.conflictCards = deck.conflictCards.filter(card => !!card.card);
        }
        if(deck.dynastyCards) {
            deck.dynastyCards = deck.dynastyCards.filter(card => !!card.card);
        }

        deck.stronghold = _.map(deck.stronghold, card => {
            return { count: card.count, card: state.cards[card.card.id] };
        });

        deck.role = _.map(deck.role, card => {
            return { count: card.count, card: state.cards[card.card.id] };
        });

        deck.provinceCards = _.map(deck.provinceCards, card => {
            return { count: card.count, card: state.cards[card.card.id] };
        });

        deck.conflictCards = _.map(deck.conflictCards, card => {
            return { count: card.count, card: state.cards[card.card.id] };
        });

        deck.dynastyCards = _.map(deck.dynastyCards, card => {
            return { count: card.count, card: state.cards[card.card.id] };
        });
    });
}

export default function(state = {}, action) {
    let newState;
    switch(action.type) {
        case 'RECEIVE_CARDS':
            var agendas = {};

            _.each(action.response.cards, card => {
                if(card.type === 'agenda' && card.pack_code !== 'VDS') {
                    agendas[card.id] = card;
                }
            });

            var banners = _.filter(agendas, card => {
                return card.label.startsWith('Banner of the');
            });

            return Object.assign({}, state, {
                cards: action.response.cards,
                agendas: agendas,
                banners: banners
            });
        case 'RECEIVE_PACKS':
            return Object.assign({}, state, {
                packs: action.response.packs
            });
        case 'RECEIVE_FACTIONS':
            var factions = {};

            _.each(action.response.factions, faction => {
                factions[faction.value] = faction;
            });

            return Object.assign({}, state, {
                factions: factions
            });
        case 'RECEIVE_FORMATS':
            var formats = {};

            _.each(action.response.formats, format => {
                formats[format.value] = format;
            });

            return Object.assign({}, state, {
                formats: formats
            });
        case 'ZOOM_CARD':
            return Object.assign({}, state, {
                zoomCard: action.card
            });
        case 'CLEAR_ZOOM':
            return Object.assign({}, state, {
                zoomCard: undefined
            });
        case 'RECEIVE_DECKS':
            processDecks(action.response.decks, state);
            newState = Object.assign({}, state, {
                singleDeck: false,
                decks: action.response.decks
            });

            newState = selectDeck(newState, newState.decks[0]);

            return newState;
        case 'REQUEST_DECK':
            return Object.assign({}, state, {
                deckSaved: false,
                deckDeleted: false
            });
        case 'REQUEST_DECKS':
            newState = Object.assign({}, state, {
                deckSaved: false,
                deckDeleted: false
            });

            if(newState.selectedDeck && !newState.selectedDeck._id) {
                if(_.size(newState.decks) > 0) {
                    newState.selectedDeck = newState.decks[0];
                }
            }

            return newState;
        case 'RECEIVE_DECK':
            newState = Object.assign({}, state, {
                singleDeck: true,
                deckSaved: false
            });

            processDecks([action.response.deck], state);

            newState.decks = _.map(state.decks, deck => {
                if(action.response.deck._id === deck.id) {
                    return deck;
                }

                return deck;
            });

            if(!_.any(newState.decks, deck => {
                return deck._id === action.response.deck._id;
            })) {
                newState.decks.push(action.response.deck);
            }

            var selected = _.find(newState.decks, deck => {
                return deck._id === action.response.deck._id;
            });

            newState = selectDeck(newState, selected);

            return newState;
        case 'SELECT_DECK':
            newState = Object.assign({}, state, {
                selectedDeck: action.deck,
                deckSaved: false
            });

            if(newState.selectedDeck) {
                processDecks([newState.selectedDeck], state);
            }

            return newState;
        case 'ADD_DECK':
            var newDeck = { name: 'New Deck' };

            newState = Object.assign({}, state, {
                selectedDeck: newDeck,
                deckSaved: false
            });

            processDecks([newState.selectedDeck], state);

            return newState;
        case 'UPDATE_DECK':
            newState = Object.assign({}, state, {
                selectedDeck: action.deck,
                deckSaved: false
            });

            if(newState.selectedDeck) {
                processDecks([newState.selectedDeck], state);
            }

            return newState;
        case 'UPDATE_DECK_STATUS':
            newState = Object.assign({}, state);

            // Update status in the decks array
            if(newState.decks) {
                newState.decks = newState.decks.map(deck => {
                    if(deck._id === action.deckId) {
                        return Object.assign({}, deck, { status: action.status });
                    }
                    return deck;
                });
            }

            // Update status in the selected deck if it matches
            if(newState.selectedDeck && newState.selectedDeck._id === action.deckId) {
                newState.selectedDeck = Object.assign({}, newState.selectedDeck, { status: action.status });
            }

            return newState;
        case 'SAVE_DECK':
            newState = Object.assign({}, state, {
                deckSaved: false
            });

            return newState;
        case 'DECK_SAVED':
            newState = Object.assign({}, state, {
                deckSaved: true,
                decks: undefined
            });

            return newState;
        case 'DECK_DELETED':
            newState = Object.assign({}, state, {
                deckDeleted: true
            });

            newState.decks = _.reject(newState.decks, deck => {
                return deck._id === action.response.deckId;
            });

            newState.selectedDeck = _.first(newState.decks);

            return newState;
        case 'DECKS_DELETED':
            newState = Object.assign({}, state, {
                deckDeleted: true
            });

            newState.decks = _.reject(newState.decks, deck => {
                return _.contains(action.response.deckIds, deck._id);
            });

            newState.selectedDeck = _.first(newState.decks);

            return newState;
        case 'CLEAR_DECK_STATUS':
            return Object.assign({}, state, {
                deckDeleted: false,
                deckSaved: false
            });
        case 'RECEIVE_DECKS_UNVALIDATED':
            processDecks(action.decks, state);
            newState = Object.assign({}, state, {
                singleDeck: false,
                decks: action.decks,
                decksValidating: true
            });

            newState = selectDeck(newState, newState.decks[0]);

            return newState;
        case 'UPDATE_DECKS_VALIDATION':
            newState = Object.assign({}, state);

            if(newState.decks) {
                newState.decks = newState.decks.map(deck => {
                    const validation = _.find(action.validations, v => v.deckId === deck._id);
                    if(validation) {
                        return Object.assign({}, deck, { status: validation.status });
                    }
                    return deck;
                });
            }

            if(newState.selectedDeck) {
                const selectedValidation = _.find(action.validations, v => v.deckId === newState.selectedDeck._id);
                if(selectedValidation) {
                    newState.selectedDeck = Object.assign({}, newState.selectedDeck, { status: selectedValidation.status });
                }
            }

            return newState;
        case 'DECKS_VALIDATION_COMPLETE':
            return Object.assign({}, state, {
                decksValidating: false
            });
        default:
            return state;
    }
}
