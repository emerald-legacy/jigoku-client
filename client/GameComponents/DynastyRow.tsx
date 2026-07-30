import React from "react";

import type { AdditionalPile } from "./AdditionalCardPile";

import CardPile from "./CardPile";
import Province from "./Province";
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

function DynastyRow({
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
    spectating
}: DynastyRowProps) {
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
