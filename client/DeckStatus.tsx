import React, { useMemo } from "react";
import { bindActionCreators } from "@reduxjs/toolkit";

import InnerDeckStatus from "./InnerDeckStatus";
import * as actions from "./actions";
import { useAppDispatch } from "./hooks";
import type { Deck } from "./types/deck";

export { default as InnerDeckStatus } from "./InnerDeckStatus";

interface DeckStatusOwnProps {
    className?: string;
    deck?: Deck;
}

export default function DeckStatus(ownProps: DeckStatusOwnProps) {
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    return <InnerDeckStatus { ...boundActions } { ...ownProps } />;
}
