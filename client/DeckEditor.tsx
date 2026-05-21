import React, { useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";

import InnerDeckEditor from "./InnerDeckEditor";
import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { Deck } from "./types/deck";
import type { RootState } from "./types/redux";

export { default as InnerDeckEditor } from "./InnerDeckEditor";

function mapStateToProps(state: RootState) {
    return {
        apiError: state.api.message,
        alliances: state.cards.factions,
        cards: state.cards.cards,
        deck: state.cards.selectedDeck,
        decks: state.cards.decks,
        factions: state.cards.factions,
        formats: state.cards.formats,
        loading: state.cards.loading,
        packs: state.cards.packs
    };
}

interface DeckEditorOwnProps {
    onDeckSave?: (deck: Deck | undefined) => void;
}

export default function DeckEditor(ownProps: DeckEditorOwnProps) {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    return <InnerDeckEditor { ...props } { ...boundActions } { ...ownProps } />;
}
