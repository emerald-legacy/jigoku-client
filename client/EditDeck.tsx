import React, { useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { useNavigate, useParams } from "react-router-dom";

import DeckSummary from "./DeckSummary";
import DeckEditor from "./DeckEditor";
import AlertPanel from "./SiteComponents/AlertPanel";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";
import type { Deck } from "./types/deck";
import type { Card } from "./types/game";

interface InnerEditDeckProps {
    apiError?: string;
    cards?: Record<string, Card>;
    deck?: Deck;
    deckSaved?: boolean;
    loadDeck: (id?: string) => void;
    loading?: boolean;
    saveDeck: (deck: Deck | undefined) => void;
}

export function InnerEditDeck({ apiError, cards, deck, deckSaved, loadDeck, loading, saveDeck }: InnerEditDeckProps) {
    const navigate = useNavigate();
    const { deckId } = useParams<{ deckId: string }>();

    useEffect(() => {
        if(deckId) {
            loadDeck(deckId);
        } else if(deck) {
            navigate(`/decks/edit/${deck._id}`, { replace: true });
            loadDeck(deck._id);
        }
    }, [deckId, deck, loadDeck, navigate]);

    useEffect(() => {
        if(deckSaved) {
            navigate("/decks");
        }
    }, [deckSaved, navigate]);

    const handleEditDeck = (deckData: Deck | undefined) => {
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
        loading: state.cards.loading
    };
}

export default function EditDeck() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    const merged = { ...props, ...boundActions } as InnerEditDeckProps;
    return <InnerEditDeck { ...merged } />;
}
