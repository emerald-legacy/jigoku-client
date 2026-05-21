import React, { useMemo } from "react";
import { bindActionCreators } from "@reduxjs/toolkit";

import * as actions from "./actions";
import { useAppDispatch, useAppSelector } from "./hooks";
import { InnerGameBoard, type InnerGameBoardProps } from "./InnerGameBoard";

export { InnerGameBoard, type InnerGameBoardProps };

type ActionFn = (...args: unknown[]) => unknown;

export default function GameBoard() {
    const dispatch = useAppDispatch();
    const cardToZoom = useAppSelector(state => state.cards.zoomCard);
    const cards = useAppSelector(state => state.cards.cards);
    const currentGame = useAppSelector(state => state.games.currentGame);
    const pendingAnimations = useAppSelector(state => state.games.pendingAnimations);
    const user = useAppSelector(state => state.auth.user);
    const username = useAppSelector(state => state.auth.username);

    const boundActions = useMemo(
        () => bindActionCreators(actions as unknown as Record<string, ActionFn>, dispatch),
        [dispatch]
    );

    return (
        <InnerGameBoard
            cardToZoom={ cardToZoom }
            cards={ cards }
            currentGame={ currentGame }
            pendingAnimations={ pendingAnimations }
            user={ user }
            username={ username }
            dispatch={ dispatch }
            boundActions={ boundActions }
        />
    );
}
