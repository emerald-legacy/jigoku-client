import { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';

import DeckSummary from './DeckSummary.jsx';
import DeckEditor from './DeckEditor.jsx';
import AlertPanel from './SiteComponents/AlertPanel.jsx';

import * as actions from './actions';

export function InnerEditDeck({ apiError, cards, deck, deckId, deckSaved, loadDeck, loading, navigate, saveDeck, setUrl }) {
    useEffect(() => {
        if(deckId) {
            loadDeck(deckId);
        } else if(deck) {
            setUrl('/decks/edit/' + deck._id);
            loadDeck(deck._id);
        }
    }, [deckId, deck, loadDeck, setUrl]);

    useEffect(() => {
        if(deckSaved) {
            navigate('/decks');
        }
    }, [deckSaved, navigate]);

    const handleEditDeck = useCallback((deckData) => {
        saveDeck(deckData);
    }, [saveDeck]);

    let content;

    if(loading) {
        content = <div>Loading decks from the server...</div>;
    } else if(apiError) {
        content = <AlertPanel type='error' message={ apiError } />;
    } else if(!deck) {
        content = <AlertPanel message='The specified deck was not found' type='error' />;
    } else {
        content = (
            <div className="row">
                <div className="col-sm-6">
                    <div className="panel-title text-center">
                        Deck Editor
                    </div>
                    <div className="panel">
                        <DeckEditor mode='Save' onDeckSave={ handleEditDeck } />
                    </div>
                </div>
                <div className="col-sm-6">
                    <div className="panel-title text-center">
                        { deck.name }
                    </div>
                    <div className="panel">
                        <DeckSummary cards={ cards } deck={ deck } />
                    </div>
                </div>
            </div>
        );
    }

    return content;
}

InnerEditDeck.displayName = 'InnerEditDeck';

function mapStateToProps(state) {
    return {
        agendas: state.cards.agendas,
        apiError: state.api.message,
        banners: state.cards.banners,
        cards: state.cards.cards,
        deck: state.cards.selectedDeck,
        deckSaved: state.cards.deckSaved,
        factions: state.cards.factions,
        formats: state.cards.formats,
        loading: state.api.loading,
        socket: state.socket.socket
    };
}

const EditDeck = connect(mapStateToProps, actions)(InnerEditDeck);

export default EditDeck;
