import React, { useEffect } from "react";
import { connect } from "react-redux";

import DeckSummary from "./DeckSummary";
import DeckEditor from "./DeckEditor";
import AlertPanel from "./SiteComponents/AlertPanel";

import * as actions from "./actions";
import type { RootState } from "./types/redux";
import type { Deck } from "./types/deck";

interface InnerEditDeckProps {
    apiError?: string;
    cards?: Record<string, any>;
    deck?: Deck;
    deckId?: string;
    deckSaved?: boolean;
    loadDeck: (id?: string) => any;
    loading?: boolean;
    navigate: (path: string) => any;
    saveDeck: (deck: any) => any;
    setUrl: (url: string) => any;
}

export function InnerEditDeck({ apiError, cards, deck, deckId, deckSaved, loadDeck, loading, navigate, saveDeck, setUrl }: InnerEditDeckProps) {
    useEffect(() => {
        if(deckId) {
            loadDeck(deckId);
        } else if(deck) {
            setUrl(`/decks/edit/${deck._id}`);
            loadDeck(deck._id);
        }
    }, [deckId, deck, loadDeck, setUrl]);

    useEffect(() => {
        if(deckSaved) {
            navigate("/decks");
        }
    }, [deckSaved, navigate]);

    const handleEditDeck = (deckData: any) => {
        saveDeck(deckData);
    };

    let content;

    if(loading) {
        content = <div>Loading decks from the server...</div>;
    } else if(apiError) {
        content = <AlertPanel type="error" message={ apiError } />;
    } else if(!deck) {
        content = <AlertPanel message="The specified deck was not found" type="error" />;
    } else {
        content = (
            <div className="row">
                <div className="col-sm-6">
                    <div className="panel-title text-center">
                        Deck Editor
                    </div>
                    <div className="panel">
                        <DeckEditor onDeckSave={ handleEditDeck } />
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

InnerEditDeck.displayName = "InnerEditDeck";

function mapStateToProps(state: RootState) {
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

const EditDeck: React.ComponentType = connect(mapStateToProps, actions)(InnerEditDeck);

export default EditDeck;
