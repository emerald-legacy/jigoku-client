import React, { useState } from "react";

import AdditionalCardPile from "./AdditionalCardPile";
import type { AdditionalPile } from "./AdditionalCardPile";
import CardPile from "./CardPile";
import Province from "./Province";
import { tryParseJSON } from "../util";
import type { Card, MenuItem, Player } from "../types/game";

interface DynastyRowProps {
    additionalPiles?: Record<string, AdditionalPile>;
    cardSize?: string;
    conflictDeck?: Card[];
    conflictDeckTopCard?: Card | null;
    conflictDiscardPile?: Card[];
    dynastyDeck?: Card[];
    dynastyDeckTopCard?: Card | null;
    dynastyDiscardPile?: Card[];
    isMe?: boolean;
    isSkirmish?: boolean;
    manualMode?: boolean;
    numConflictCards?: number;
    numDynastyCards?: number;
    onCardClick?: (card: Card) => void;
    onConflictClick?: () => void;
    onConflictShuffleClick?: () => void;
    onDiscardedCardClick?: (cardId: string) => void;
    onDragDrop?: (card: Card, source: string, target: string) => void;
    onDynastyClick?: () => void;
    onDynastyShuffleClick?: () => void;
    onMenuItemClick?: (card: Card, menuItem: MenuItem) => void;
    onMouseOut?: (card: Card) => void;
    onMouseOver?: (card: Card) => void;
    otherPlayer?: Player;
    province1Cards?: Card[];
    province2Cards?: Card[];
    province3Cards?: Card[];
    province4Cards?: Card[];
    removedFromGame?: Card[];
    showConflictDeck?: boolean;
    showDynastyDeck?: boolean;
    spectating?: boolean;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function DynastyRow({
    additionalPiles,
    cardSize,
    conflictDeck,
    conflictDeckTopCard,
    conflictDiscardPile,
    dynastyDeck,
    dynastyDeckTopCard,
    dynastyDiscardPile,
    isMe,
    isSkirmish,
    manualMode,
    numConflictCards,
    numDynastyCards,
    onCardClick,
    onConflictClick,
    onConflictShuffleClick,
    onDiscardedCardClick,
    onDragDrop,
    onDynastyClick,
    onDynastyShuffleClick,
    onMenuItemClick,
    onMouseOut,
    onMouseOver,
    otherPlayer,
    province1Cards,
    province2Cards,
    province3Cards,
    province4Cards,
    removedFromGame,
    showConflictDeck,
    showDynastyDeck,
    spectating
}: DynastyRowProps) {
    const [showConflictMenu, setShowConflictMenu] = useState(false);
    const [showDynastyMenu, setShowDynastyMenu] = useState(false);

    const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
        (event.target as HTMLElement).classList.add("highlight-panel");
        event.preventDefault();
    };

    const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
        (event.target as HTMLElement).classList.remove("highlight-panel");
    };

    const handleDragDrop = (event: React.DragEvent<HTMLElement>, target: string) => {
        event.stopPropagation();
        event.preventDefault();

        (event.target as HTMLElement).classList.remove("highlight-panel");

        const card = event.dataTransfer.getData("Text");

        if(!card) {
            return;
        }

        const dragData = tryParseJSON(card);
        if(!dragData) {
            return;
        }

        if(onDragDrop) {
            onDragDrop(dragData.card, dragData.source, target);
        }
    };
    /* eslint-enable @typescript-eslint/no-unused-vars */

    const handleConflictCloseClick = () => {
        if(onConflictClick) {
            onConflictClick();
        }
    };

    const handleConflictCloseAndShuffleClick = () => {
        if(onConflictClick) {
            onConflictClick();
        }

        if(onConflictShuffleClick) {
            onConflictShuffleClick();
        }
    };

    const handleDynastyCloseClick = () => {
        if(onDynastyClick) {
            onDynastyClick();
        }
    };

    const handleDynastyCloseAndShuffleClick = () => {
        if(onDynastyClick) {
            onDynastyClick();
        }

        if(onDynastyShuffleClick) {
            onDynastyShuffleClick();
        }
    };

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const handleDiscardedCardClick = (event: React.MouseEvent, cardId: string) => {
        event.preventDefault();
        event.stopPropagation();

        if(onDiscardedCardClick) {
            onDiscardedCardClick(cardId);
        }
    };

    const handleConflictClick = () => {
        setShowConflictMenu(prev => !prev);
    };

    const handleDynastyMenuClick = () => {
        setShowDynastyMenu(prev => !prev);
    };
    /* eslint-enable @typescript-eslint/no-unused-vars */

    const handleConflictShuffleClick = () => {
        if(onConflictShuffleClick) {
            onConflictShuffleClick();
        }
    };

    const handleDynastyShuffleClick = () => {
        if(onDynastyShuffleClick) {
            onDynastyShuffleClick();
        }
    };

    const handleShowConflictDeckClick = () => {
        if(onConflictClick) {
            onConflictClick();
        }
    };

    const handleShowDynastyDeckClick = () => {
        if(onDynastyClick) {
            onDynastyClick();
        }
    };

    /* eslint-disable @typescript-eslint/no-unused-vars */
    let additionalPilesElements;
    if(!additionalPiles) {
        additionalPilesElements = [];
    } else {
        const piles = Object.values(additionalPiles).filter((pile: AdditionalPile) => pile.cards.length > 0 && pile.area === "player row");
        let index = 0;
        additionalPilesElements = piles.map((pile: AdditionalPile) => (
            <AdditionalCardPile
                key={ `additional-pile-${index++}` }
                className="additional-cards"
                isMe={ isMe }
                onMouseOut={ onMouseOut }
                onMouseOver={ onMouseOver }
                pile={ pile }
                spectating={ spectating }
            />
        ));
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */

    const conflictDeckMenu = [
        { text: "Show", handler: handleShowConflictDeckClick, showPopup: true },
        { text: "Shuffle", handler: handleConflictShuffleClick }
    ];

    const dynastyDeckMenu = [
        { text: "Show", handler: handleShowDynastyDeckClick, showPopup: true },
        { text: "Shuffle", handler: handleDynastyShuffleClick }
    ];

    const conflictDeckPopupMenu = [
        { text: "Close", handler: handleConflictCloseClick },
        { text: "Close and Shuffle", handler: handleConflictCloseAndShuffleClick }
    ];

    const dynastyDeckPopupMenu = [
        { text: "Close", handler: handleDynastyCloseClick },
        { text: "Close and Shuffle", handler: handleDynastyCloseAndShuffleClick }
    ];

    const popupLocation = isMe || spectating ? "top" : "bottom";

    if(isMe || (spectating && !otherPlayer)) {
        return (
            <div className="dynasty-row no-highlight">
                <div className="deck-cards">
                    <div className="left-decks">
                        <CardPile
                            className="dynasty discard pile"
                            title="Dynasty Discard"
                            source="dynasty discard pile"
                            cards={ dynastyDiscardPile }
                            onMouseOver={ onMouseOver }
                            onMouseOut={ onMouseOut }
                            onCardClick={ onCardClick }
                            popupLocation={ popupLocation }
                            onDragDrop={ onDragDrop }
                            size={ cardSize }
                        />
                        <CardPile
                            className="dynasty draw"
                            title="Dynasty"
                            source="dynasty deck"
                            cards={ dynastyDeck }
                            onMouseOver={ onMouseOver }
                            onMouseOut={ onMouseOut }
                            onCardClick={ onCardClick }
                            popupLocation="top"
                            disableMenu={ spectating || !isMe || !manualMode }
                            onDragDrop={ onDragDrop }
                            menu={ dynastyDeckMenu }
                            topCard={ dynastyDeckTopCard }
                            hiddenTopCard={ !dynastyDeckTopCard }
                            cardCount={ numDynastyCards }
                            popupMenu={ dynastyDeckPopupMenu }
                            size={ cardSize }
                        />
                    </div>
                    <div className="province-row">
                        <Province isMe={ isMe } source="province 1" cards={ province1Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onDragDrop={ onDragDrop } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } />
                        <Province isMe={ isMe } source="province 2" cards={ province2Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onDragDrop={ onDragDrop } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } />
                        <Province isMe={ isMe } source="province 3" cards={ province3Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onDragDrop={ onDragDrop } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } />
                        { !isSkirmish ? <Province isMe={ isMe } source="province 4" cards={ province4Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onDragDrop={ onDragDrop } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } /> : null }
                    </div>
                    <div className="right-decks">
                        <CardPile
                            className="conflict draw"
                            title="Conflict"
                            source="conflict deck"
                            cards={ conflictDeck }
                            onMouseOver={ onMouseOver }
                            onMouseOut={ onMouseOut }
                            onCardClick={ onCardClick }
                            popupLocation="top"
                            disableMenu={ spectating || !isMe || !manualMode }
                            onDragDrop={ onDragDrop }
                            menu={ conflictDeckMenu }
                            topCard={ conflictDeckTopCard }
                            hiddenTopCard={ !conflictDeckTopCard }
                            cardCount={ numConflictCards }
                            popupMenu={ conflictDeckPopupMenu }
                            size={ cardSize }
                        />
                        <CardPile
                            className="conflict discard pile"
                            title="Conflict Discard"
                            source="conflict discard pile"
                            cards={ conflictDiscardPile }
                            onMouseOver={ onMouseOver }
                            onMouseOut={ onMouseOut }
                            onCardClick={ onCardClick }
                            popupLocation={ popupLocation }
                            onDragDrop={ onDragDrop }
                            size={ cardSize }
                        />
                        <CardPile
                            className="removed-from-game-pile discard"
                            title="Removed From Game"
                            source="removed from game"
                            cards={ removedFromGame }
                            onMouseOver={ onMouseOver }
                            onMouseOut={ onMouseOut }
                            onCardClick={ onCardClick }
                            popupLocation={ popupLocation }
                            onDragDrop={ onDragDrop }
                            size={ cardSize }
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dynasty-row no-highlight">
            <div className="deck-cards">
                <div className="left-decks">
                    <CardPile
                        className="removed-from-game-pile discard"
                        title="Removed From Game"
                        source="removed from game"
                        cards={ removedFromGame }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onCardClick={ onCardClick }
                        popupLocation={ popupLocation }
                        onDragDrop={ onDragDrop }
                        size={ cardSize }
                    />
                    <CardPile
                        className="conflict discard pile"
                        title="Conflict Discard"
                        source="conflict discard pile"
                        cards={ conflictDiscardPile }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onCardClick={ onCardClick }
                        popupLocation={ popupLocation }
                        onDragDrop={ onDragDrop }
                        size={ cardSize }
                    />
                    <CardPile
                        className="conflict deck"
                        title="Conflict"
                        source="conflict deck"
                        cards={ conflictDeck }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onCardClick={ onCardClick }
                        popupLocation="top"
                        disableMenu
                        hiddenTopCard={ !conflictDeckTopCard }
                        onDragDrop={ onDragDrop }
                        menu={ conflictDeckMenu }
                        topCard={ conflictDeckTopCard }
                        cardCount={ numConflictCards }
                        popupMenu={ conflictDeckPopupMenu }
                        size={ cardSize }
                    />
                </div>
                <div className="province-row">
                    { !isSkirmish ? <Province isMe={ isMe } source="province 4" cards={ province4Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } /> : null }
                    <Province isMe={ isMe } source="province 3" cards={ province3Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } />
                    <Province isMe={ isMe } source="province 2" cards={ province2Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } />
                    <Province isMe={ isMe } source="province 1" cards={ province1Cards } onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onCardClick={ onCardClick } size={ cardSize } onMenuItemClick={ onMenuItemClick } popupLocation={ popupLocation } />
                </div>
                <div className="left-decks">
                    <CardPile
                        className="dynasty draw"
                        title="Dynasty"
                        source="dynasty deck"
                        cards={ dynastyDeck }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onCardClick={ onCardClick }
                        popupLocation="top"
                        disableMenu
                        onDragDrop={ onDragDrop }
                        menu={ dynastyDeckMenu }
                        topCard={ dynastyDeckTopCard }
                        hiddenTopCard={ !dynastyDeckTopCard }
                        cardCount={ numDynastyCards }
                        popupMenu={ dynastyDeckPopupMenu }
                        size={ cardSize }
                    />
                    <CardPile
                        className="dynasty discard pile"
                        title="Dynasty Discard"
                        source="dynasty discard pile"
                        cards={ dynastyDiscardPile }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onCardClick={ onCardClick }
                        popupLocation={ popupLocation }
                        onDragDrop={ onDragDrop }
                        size={ cardSize }
                    />
                </div>
            </div>
        </div>
    );
}

DynastyRow.displayName = "DynastyRow";

export default DynastyRow;
