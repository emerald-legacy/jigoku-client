import { useState } from "react";

import AdditionalCardPile from "./AdditionalCardPile.jsx";
import CardPile from "./CardPile.jsx";
import Province from "./Province.jsx";
import { tryParseJSON } from "../util.js";

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
}) {
    const [showConflictMenu, setShowConflictMenu] = useState(false);
    const [showDynastyMenu, setShowDynastyMenu] = useState(false);

    const handleDragOver = (event) => {
        event.target.classList.add("highlight-panel");
        event.preventDefault();
    };

    const handleDragLeave = (event) => {
        event.target.classList.remove("highlight-panel");
    };

    const handleDragDrop = (event, target) => {
        event.stopPropagation();
        event.preventDefault();

        event.target.classList.remove("highlight-panel");

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
    const handleDiscardedCardClick = (event, cardId) => {
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
        const piles = Object.values(additionalPiles).filter(pile => pile.cards.length > 0 && pile.area === "player row");
        let index = 0;
        additionalPilesElements = piles.map(pile => (
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
