import { createSelector } from "@reduxjs/toolkit";
import type { Card as CardType } from "../types/game";

type CardsInPlayInput = readonly CardType[] | undefined;

export function makeCardsInPlayGrouper() {
    return createSelector(
        [
            (cardsInPlay: CardsInPlayInput) => cardsInPlay,
            (_: CardsInPlayInput, isMe: boolean) => isMe
        ],
        (cardsInPlay, isMe): CardType[][] => {
            if(!cardsInPlay) {
                return [];
            }

            let sorted = [...cardsInPlay].sort((a, b) => {
                if(a.type < b.type) {
                    return -1;
                }
                if(a.type > b.type) {
                    return 1;
                }
                return 0;
            });

            if(!isMe) {
                sorted = sorted.reverse();
            }

            const cardsByType: Record<string, CardType[]> = {};
            sorted.forEach((card: CardType) => {
                const type = card.type || "";
                if(!cardsByType[type]) {
                    cardsByType[type] = [];
                }
                cardsByType[type].push(card);
            });

            return Object.values(cardsByType);
        }
    );
}
