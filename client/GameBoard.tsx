import React, { useMemo } from "react";
import { bindActionCreators } from "@reduxjs/toolkit";

import * as actions from "./actions";
import { useAppDispatch, useAppSelector } from "./hooks";
import { InnerGameBoard, type InnerGameBoardProps } from "./InnerGameBoard";
import { PatronProvider } from "./PatronContext";
import { computeViewerConfig } from "./boardCosmetics";

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

    const spectating = !currentGame || !username || !currentGame.players[username];
    const patronViewer = useMemo(() => computeViewerConfig(user, spectating), [user, spectating]);
    const patronPlayerUsernames = currentGame ? Object.values(currentGame.players).map(p => p.user?.username) : [];
    const usePromosByUsername = useMemo(() => {
        const map: Record<string, boolean> = {};
        if(currentGame) {
            for(const p of Object.values(currentGame.players)) {
                const name = p.user?.username;
                if(name) {
                    map[name] = !!p.user?.settings?.patron?.usePromos;
                }
            }
        }
        return map;
    }, [currentGame]);

    return (
        <PatronProvider viewer={ patronViewer } playerUsernames={ patronPlayerUsernames } usePromosByUsername={ usePromosByUsername }>
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
        </PatronProvider>
    );
}
