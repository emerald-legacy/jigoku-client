import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";

import DeckSummary from "./DeckSummary";
import DeckEditor from "./DeckEditor";
import AlertPanel from "./SiteComponents/AlertPanel";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";
import type { Deck } from "./types/deck";
import type { Card } from "./types/game";

interface InnerAddDeckProps {
    addDeck: () => void;
    apiError?: string;
    cards?: Record<string, Card>;
    deck?: Deck;
    deckSaved?: boolean;
    loading?: boolean;
    saveDeck: (deck: Deck | undefined) => void;
}

export function InnerAddDeck({ addDeck, apiError, cards, deck, deckSaved, loading, saveDeck }: InnerAddDeckProps) {
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        addDeck();
        setReady(true);
    }, [addDeck]);

    useEffect(() => {
        if(deckSaved) {
            navigate("/decks");
        }
    }, [deckSaved, navigate]);

    const handleAddDeck = (deckData: Deck | undefined) => {
        saveDeck(deckData);
    };

    let content;

    if(loading || !ready) {
        content = <div>Loading decks from the server...</div>;
    } else if(apiError) {
        content = <AlertPanel type="error" message={ apiError } />;
    } else {
        content = (
            <div className="row">
                <div className="col-sm-6">
                    <div className="panel-title text-center">
                        Deck Editor
                    </div>
                    <div className="panel">
                        <DeckEditor onDeckSave={ handleAddDeck } />
                    </div>
                </div>
                <div className="col-sm-6">
                    <div className="panel-title text-center">
                        { deck ? deck.name : "New Deck" }
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

InnerAddDeck.displayName = "InnerAddDeck";

function mapStateToProps(state: RootState) {
    return {
        agendas: state.cards.agendas,
        apiError: state.api.message,
        cards: state.cards.cards,
        deck: state.cards.selectedDeck,
        deckSaved: state.cards.deckSaved,
        factions: state.cards.factions,
        formats: state.cards.formats,
        loading: state.cards.loading
    };
}

export default function AddDeck() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    const merged = { ...props, ...boundActions } as InnerAddDeckProps;
    return <InnerAddDeck { ...merged } />;
}
