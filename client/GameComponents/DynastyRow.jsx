import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import AdditionalCardPile from './AdditionalCardPile.jsx';
import Card from './Card.jsx';
import CardPile from './CardPile.jsx';
import Province from './Province.jsx';
import { tryParseJSON } from '../util.js';

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

    const handleDragOver = useCallback((event) => {
        event.target.classList.add('highlight-panel');
        event.preventDefault();
    }, []);

    const handleDragLeave = useCallback((event) => {
        event.target.classList.remove('highlight-panel');
    }, []);

    const handleDragDrop = useCallback((event, target) => {
        event.stopPropagation();
        event.preventDefault();

        event.target.classList.remove('highlight-panel');

        const card = event.dataTransfer.getData('Text');

        if (!card) {
            return;
        }

        const dragData = tryParseJSON(card);
        if (!dragData) {
            return;
        }

        if (onDragDrop) {
            onDragDrop(dragData.card, dragData.source, target);
        }
    }, [onDragDrop]);

    const handleConflictCloseClick = useCallback(() => {
        if (onConflictClick) {
            onConflictClick();
        }
    }, [onConflictClick]);

    const handleConflictCloseAndShuffleClick = useCallback(() => {
        if (onConflictClick) {
            onConflictClick();
        }

        if (onConflictShuffleClick) {
            onConflictShuffleClick();
        }
    }, [onConflictClick, onConflictShuffleClick]);

    const handleDynastyCloseClick = useCallback(() => {
        if (onDynastyClick) {
            onDynastyClick();
        }
    }, [onDynastyClick]);

    const handleDynastyCloseAndShuffleClick = useCallback(() => {
        if (onDynastyClick) {
            onDynastyClick();
        }

        if (onDynastyShuffleClick) {
            onDynastyShuffleClick();
        }
    }, [onDynastyClick, onDynastyShuffleClick]);

    const handleDiscardedCardClick = useCallback((event, cardId) => {
        event.preventDefault();
        event.stopPropagation();

        if (onDiscardedCardClick) {
            onDiscardedCardClick(cardId);
        }
    }, [onDiscardedCardClick]);

    const handleConflictClick = useCallback(() => {
        setShowConflictMenu(prev => !prev);
    }, []);

    const handleDynastyMenuClick = useCallback(() => {
        setShowDynastyMenu(prev => !prev);
    }, []);

    const handleConflictShuffleClick = useCallback(() => {
        if (onConflictShuffleClick) {
            onConflictShuffleClick();
        }
    }, [onConflictShuffleClick]);

    const handleDynastyShuffleClick = useCallback(() => {
        if (onDynastyShuffleClick) {
            onDynastyShuffleClick();
        }
    }, [onDynastyShuffleClick]);

    const handleShowConflictDeckClick = useCallback(() => {
        if (onConflictClick) {
            onConflictClick();
        }
    }, [onConflictClick]);

    const handleShowDynastyDeckClick = useCallback(() => {
        if (onDynastyClick) {
            onDynastyClick();
        }
    }, [onDynastyClick]);

    const additionalPilesElements = useMemo(() => {
        if (!additionalPiles) {
            return [];
        }
        const piles = Object.values(additionalPiles).filter(pile => pile.cards.length > 0 && pile.area === 'player row');
        let index = 0;
        return piles.map(pile => (
            <AdditionalCardPile
                key={'additional-pile-' + index++}
                className='additional-cards'
                isMe={isMe}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
                pile={pile}
                spectating={spectating}
            />
        ));
    }, [additionalPiles, isMe, onMouseOut, onMouseOver, spectating]);

    const conflictDeckMenu = useMemo(() => [
        { text: 'Show', handler: handleShowConflictDeckClick, showPopup: true },
        { text: 'Shuffle', handler: handleConflictShuffleClick }
    ], [handleShowConflictDeckClick, handleConflictShuffleClick]);

    const dynastyDeckMenu = useMemo(() => [
        { text: 'Show', handler: handleShowDynastyDeckClick, showPopup: true },
        { text: 'Shuffle', handler: handleDynastyShuffleClick }
    ], [handleShowDynastyDeckClick, handleDynastyShuffleClick]);

    const conflictDeckPopupMenu = useMemo(() => [
        { text: 'Close', handler: handleConflictCloseClick },
        { text: 'Close and Shuffle', handler: handleConflictCloseAndShuffleClick }
    ], [handleConflictCloseClick, handleConflictCloseAndShuffleClick]);

    const dynastyDeckPopupMenu = useMemo(() => [
        { text: 'Close', handler: handleDynastyCloseClick },
        { text: 'Close and Shuffle', handler: handleDynastyCloseAndShuffleClick }
    ], [handleDynastyCloseClick, handleDynastyCloseAndShuffleClick]);

    const popupLocation = isMe || spectating ? 'top' : 'bottom';

    if (isMe || (spectating && !otherPlayer)) {
        return (
            <div className='dynasty-row no-highlight'>
                <div className='deck-cards'>
                    <div className='left-decks'>
                        <CardPile
                            className='dynasty discard pile'
                            title='Dynasty Discard'
                            source='dynasty discard pile'
                            cards={dynastyDiscardPile}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            onCardClick={onCardClick}
                            popupLocation={popupLocation}
                            onDragDrop={onDragDrop}
                            size={cardSize}
                        />
                        <CardPile
                            className='dynasty draw'
                            title='Dynasty'
                            source='dynasty deck'
                            cards={dynastyDeck}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            onCardClick={onCardClick}
                            popupLocation='top'
                            disableMenu={spectating || !isMe || !manualMode}
                            onDragDrop={onDragDrop}
                            menu={dynastyDeckMenu}
                            topCard={dynastyDeckTopCard}
                            hiddenTopCard={!dynastyDeckTopCard}
                            cardCount={numDynastyCards}
                            popupMenu={dynastyDeckPopupMenu}
                            size={cardSize}
                        />
                    </div>
                    <div className='province-row'>
                        <Province isMe={isMe} source='province 1' cards={province1Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onDragDrop={onDragDrop} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} />
                        <Province isMe={isMe} source='province 2' cards={province2Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onDragDrop={onDragDrop} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} />
                        <Province isMe={isMe} source='province 3' cards={province3Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onDragDrop={onDragDrop} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} />
                        {!isSkirmish ? <Province isMe={isMe} source='province 4' cards={province4Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onDragDrop={onDragDrop} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} /> : null}
                    </div>
                    <div className='right-decks'>
                        <CardPile
                            className='conflict draw'
                            title='Conflict'
                            source='conflict deck'
                            cards={conflictDeck}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            onCardClick={onCardClick}
                            popupLocation='top'
                            disableMenu={spectating || !isMe || !manualMode}
                            onDragDrop={onDragDrop}
                            menu={conflictDeckMenu}
                            topCard={conflictDeckTopCard}
                            hiddenTopCard={!conflictDeckTopCard}
                            cardCount={numConflictCards}
                            popupMenu={conflictDeckPopupMenu}
                            size={cardSize}
                        />
                        <CardPile
                            className='conflict discard pile'
                            title='Conflict Discard'
                            source='conflict discard pile'
                            cards={conflictDiscardPile}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            onCardClick={onCardClick}
                            popupLocation={popupLocation}
                            onDragDrop={onDragDrop}
                            size={cardSize}
                        />
                        <CardPile
                            className='removed-from-game-pile discard'
                            title='Removed From Game'
                            source='removed from game'
                            cards={removedFromGame}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            onCardClick={onCardClick}
                            popupLocation={popupLocation}
                            onDragDrop={onDragDrop}
                            size={cardSize}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='dynasty-row no-highlight'>
            <div className='deck-cards'>
                <div className='left-decks'>
                    <CardPile
                        className='removed-from-game-pile discard'
                        title='Removed From Game'
                        source='removed from game'
                        cards={removedFromGame}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onCardClick={onCardClick}
                        popupLocation={popupLocation}
                        onDragDrop={onDragDrop}
                        size={cardSize}
                    />
                    <CardPile
                        className='conflict discard pile'
                        title='Conflict Discard'
                        source='conflict discard pile'
                        cards={conflictDiscardPile}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onCardClick={onCardClick}
                        popupLocation={popupLocation}
                        onDragDrop={onDragDrop}
                        size={cardSize}
                    />
                    <CardPile
                        className='conflict deck'
                        title='Conflict'
                        source='conflict deck'
                        cards={conflictDeck}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onCardClick={onCardClick}
                        popupLocation='top'
                        disableMenu
                        hiddenTopCard={!conflictDeckTopCard}
                        onDragDrop={onDragDrop}
                        menu={conflictDeckMenu}
                        topCard={conflictDeckTopCard}
                        cardCount={numConflictCards}
                        popupMenu={conflictDeckPopupMenu}
                        size={cardSize}
                    />
                </div>
                <div className='province-row'>
                    {!isSkirmish ? <Province isMe={isMe} source='province 4' cards={province4Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} /> : null}
                    <Province isMe={isMe} source='province 3' cards={province3Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} />
                    <Province isMe={isMe} source='province 2' cards={province2Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} />
                    <Province isMe={isMe} source='province 1' cards={province1Cards} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onCardClick={onCardClick} size={cardSize} onMenuItemClick={onMenuItemClick} popupLocation={popupLocation} />
                </div>
                <div className='left-decks'>
                    <CardPile
                        className='dynasty draw'
                        title='Dynasty'
                        source='dynasty deck'
                        cards={dynastyDeck}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onCardClick={onCardClick}
                        popupLocation='top'
                        disableMenu
                        onDragDrop={onDragDrop}
                        menu={dynastyDeckMenu}
                        topCard={dynastyDeckTopCard}
                        hiddenTopCard={!dynastyDeckTopCard}
                        cardCount={numDynastyCards}
                        popupMenu={dynastyDeckPopupMenu}
                        size={cardSize}
                    />
                    <CardPile
                        className='dynasty discard pile'
                        title='Dynasty Discard'
                        source='dynasty discard pile'
                        cards={dynastyDiscardPile}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onCardClick={onCardClick}
                        popupLocation={popupLocation}
                        onDragDrop={onDragDrop}
                        size={cardSize}
                    />
                </div>
            </div>
        </div>
    );
}

DynastyRow.displayName = 'DynastyRow';
DynastyRow.propTypes = {
    additionalPiles: PropTypes.object,
    cardSize: PropTypes.string,
    conflictDeck: PropTypes.array,
    conflictDeckTopCard: PropTypes.object,
    conflictDiscardPile: PropTypes.array,
    dynastyDeck: PropTypes.array,
    dynastyDeckTopCard: PropTypes.object,
    dynastyDiscardPile: PropTypes.array,
    hand: PropTypes.array,
    honor: PropTypes.number,
    isMe: PropTypes.bool,
    isSkirmish: PropTypes.bool,
    manualMode: PropTypes.bool,
    numConflictCards: PropTypes.number,
    numDynastyCards: PropTypes.number,
    onCardClick: PropTypes.func,
    onConflictClick: PropTypes.func,
    onConflictShuffleClick: PropTypes.func,
    onDiscardedCardClick: PropTypes.func,
    onDragDrop: PropTypes.func,
    onDynastyClick: PropTypes.func,
    onDynastyShuffleClick: PropTypes.func,
    onMenuItemClick: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    otherPlayer: PropTypes.object,
    province1Cards: PropTypes.array,
    province2Cards: PropTypes.array,
    province3Cards: PropTypes.array,
    province4Cards: PropTypes.array,
    provinceDeck: PropTypes.array,
    removedFromGame: PropTypes.array,
    showConflictDeck: PropTypes.bool,
    showDynastyDeck: PropTypes.bool,
    spectating: PropTypes.bool
};

export default DynastyRow;
