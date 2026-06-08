import React, { useState } from "react";

import DeckStatus from "./DeckStatus";
import DeckStats from "./DeckStats";
import { getCardImageUrl, preferredPackId, type CardWithVersions } from "./cardImageUrl";
import { asset } from "./assetUrl";
import type { Card } from "./types/game";
import type { Deck, DeckCard } from "./types/deck";

type DeckCardWithSide = Card & { side?: string };

type DeckStatsProp = React.ComponentProps<typeof DeckStats>["stats"];

interface DeckSummaryProps {
    cards?: Record<string, Card>;
    deck?: Deck;
    stats?: DeckStatsProp;
}

function DeckSummary({ cards, deck, stats }: DeckSummaryProps) {
    const [cardToShow, setCardToShow] = useState<Card | undefined>(undefined);
    const [packIdToShow, setPackIdToShow] = useState<string | undefined>(undefined);

    const onCardMouseOver = (event: React.MouseEvent, id: string, packId?: string) => {
        const cardToDisplay = Object.values(cards || {}).find((card: Card) => id === card.id);
        setCardToShow(cardToDisplay);
        setPackIdToShow(packId);
    };

    const onCardMouseOut = () => {
        setCardToShow(undefined);
        setPackIdToShow(undefined);
    };

    const formatValue = deck?.format?.value || "";

    const getCardImagePath = (card: Card | undefined, packId?: string) => {
        if(!card) {
            return "";
        }
        const effectivePackId = packId || preferredPackId(card as CardWithVersions, formatValue);
        return getCardImageUrl(card.id, effectivePackId);
    };

    const getCardsToRender = () => {
        if(!deck) {
            return [];
        }
        const cardsToRender: React.ReactNode[] = [];
        const groupedCards: Record<string, DeckCard[]> = {};

        const allCardArrays = [
            deck.stronghold,
            deck.role,
            deck.provinceCards,
            deck.dynastyCards,
            deck.conflictCards
        ];
        const combinedCards = allCardArrays
            .flat()
            .filter((card): card is DeckCard => !!(card && card.card));

        for(const card of combinedCards) {
            const innerCard = card.card as DeckCardWithSide;
            let type = innerCard.type || "";

            if(type === "character" || type === "event") {
                type = (innerCard.side || "") + ` ${type}`;
            }
            if(!groupedCards[type]) {
                groupedCards[type] = [card];
            } else {
                groupedCards[type].push(card);
            }
        }

        for(const [key, cardList] of Object.entries(groupedCards)) {
            const cardElements: React.ReactNode[] = [];
            let count = 0;

            for(const card of cardList) {
                const cardKey = card.pack_id
                    ? `${card.card.id}-${card.pack_id}`
                    : card.card.id;
                cardElements.push(
                    <div key={ cardKey }>
                        <span>{ `${card.count}x ` }</span>
                        <span
                            className="card-link"
                            onMouseOver={ (event) =>
                                onCardMouseOver(event, card.card.id, card.pack_id)
                            }
                            onMouseOut={ onCardMouseOut }
                        >
                            { card.card.name }
                        </span>
                    </div>
                );
                count += card.count;
            }

            cardsToRender.push(
                <div className="cards-no-break" key={ key }>
                    <div className="card-group-title">{ `${key} (${count})` }</div>
                    <div className="card-group">{ cardElements }</div>
                </div>
            );
        }

        return cardsToRender;
    };

    const getDeckCount = (deckCards?: DeckCard[]) => {
        let count = 0;
        if(deckCards) {
            for(const card of deckCards) {
                count += card.count;
            }
        }
        return count;
    };

    if(!deck) {
        return <div>Waiting for selected deck...</div>;
    }

    const cardsToRender = getCardsToRender();
    const provinceCount = getDeckCount(deck.provinceCards);
    const dynastyCount = getDeckCount(deck.dynastyCards);
    const conflictCount = getDeckCount(deck.conflictCards);

    return (
        <div className="deck-summary col-xs-12">
            { cardToShow ? (
                <img
                    className="hover-image"
                    src={ getCardImagePath(cardToShow, packIdToShow) }
                />
            ) : null }
            <div className="decklist">
                <div className="col-xs-2 col-sm-3 no-x-padding">
                    { deck.faction ? (
                        <img
                            className="deck-mon img-responsive"
                            src={ asset(`mons/${deck.faction.value}.png`) }
                        />
                    ) : null }
                </div>
                <div className="col-xs-8 col-sm-6">
                    <div className="info-row row">
                        <span>Clan:</span>
                        { deck.faction ? (
                            <span className="pull-right">{ deck.faction.name }</span>
                        ) : null }
                    </div>
                    <div className="info-row row">
                        <span>Alliance:</span>
                        { deck.alliance && deck.alliance.name ? (
                            <span className="pull-right">{ deck.alliance.name }</span>
                        ) : (
                            <span> None </span>
                        ) }
                    </div>
                    <div className="info-row row">
                        <span>Format:</span>
                        <span className="pull-right">
                            { deck.format ? deck.format.name : "Emerald" }
                        </span>
                    </div>
                    <div className="info-row row">
                        <span>Province deck:</span>
                        <span className="pull-right">{ provinceCount } cards</span>
                    </div>
                    <div className="info-row row">
                        <span>Dynasty Deck:</span>
                        <span className="pull-right">{ dynastyCount } cards</span>
                    </div>
                    <div className="info-row row">
                        <span>Conflict Deck:</span>
                        <span className="pull-right">{ conflictCount } cards</span>
                    </div>
                    <div className="info-row row">
                        <span>Validity:</span>
                        <DeckStatus className="pull-right" deck={ deck } />
                    </div>
                </div>
                <div className="col-xs-2 col-sm-3 no-x-padding">
                    { deck.alliance && deck.alliance.value !== "none" ? (
                        <img
                            className="deck-alliance-mon img-responsive"
                            src={ asset(`mons/${deck.alliance.value}.png`) }
                        />
                    ) : null }
                </div>
            </div>
            <DeckStats stats={ stats } />
            <div className="col-xs-12 no-x-padding">
                <div className="cards">{ cardsToRender }</div>
            </div>
        </div>
    );
}

DeckSummary.displayName = "DeckSummary";

export default DeckSummary;
