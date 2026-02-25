import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import Card from './Card.jsx';
import { tryParseJSON } from '../util.js';

function PlayerHand({ cardSize, cards, isMe, onCardClick, onDragDrop, onMouseOut, onMouseOver }) {
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

        const cardData = event.dataTransfer.getData('Text');

        if(!cardData) {
            return;
        }

        const dragData = tryParseJSON(cardData);
        if(!dragData) {
            return;
        }

        if(onDragDrop) {
            onDragDrop(dragData.card, dragData.source, target);
        }
    }, [onDragDrop]);

    const getCardWidth = useCallback(() => {
        switch(cardSize) {
            case 'small':
                return 65 * 0.8;
            case 'large':
                return 65 * 1.4;
            case 'x-large':
                return 65 * 2;
            case 'normal':
            default:
                return 65;
        }
    }, [cardSize]);

    const cardWidth = getCardWidth();

    const maxWidth = useMemo(() => {
        switch(cardSize) {
            case 'small':
            case 'large':
            case 'x-large':
            case 'xxl':
                return cardWidth * 7.5;
            default:
                return 480;
        }
    }, [cardSize, cardWidth]);

    const needsSquish = cards && cards.length * cardWidth > maxWidth;

    const handCards = useMemo(() => {
        const handLength = cards ? cards.length : 0;
        let cardIndex = 1;
        let attachmentOffset = 13;

        switch(cardSize) {
            case 'large':
                attachmentOffset *= 1.4;
                break;
            case 'small':
                attachmentOffset *= 0.8;
                break;
            case 'x-large':
                attachmentOffset *= 2;
                break;
        }

        return cards?.map((card) => {
            let className = '';
            if(needsSquish) {
                className += ' squish';
                if(cardIndex++ === handLength) {
                    className += ' tail';
                    if(attachmentOffset > (480 / (cardWidth * handLength))) {
                        className += ' nohide';
                    }
                }
            }

            return (
                <Card
                    key={ card.uuid }
                    card={ card }
                    className={ className }
                    style={ {} }
                    disableMouseOver={ !isMe }
                    source='hand'
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    onClick={ onCardClick }
                    onDragDrop={ onDragDrop }
                    size={ cardSize }
                />
            );
        }) || [];
    }, [cards, cardSize, needsSquish, cardWidth, isMe, onMouseOver, onMouseOut, onCardClick, onDragDrop]);

    let className = 'panel hand';
    let titleBarClassName = 'hand-title-bar no-highlight';

    if(cardSize !== 'normal') {
        className += ' ' + cardSize;
        titleBarClassName += ' ' + cardSize;
    }

    // Calculate dynamic width based on number of cards
    let handWidth = maxWidth;
    if(cards && !needsSquish) {
        handWidth = Math.max(cardWidth * cards.length, cardWidth);
    }

    if(needsSquish) {
        className += ' squish';
    }

    const handStyle = { width: handWidth + 'px' };
    const titleBarStyle = { width: handWidth + 'px' };

    return (
        <div>
            <grip>
                <div className={ titleBarClassName } style={ titleBarStyle }>
                    { 'Hand (' + handCards.length + ')' }
                </div>
            </grip>
            <div
                className={ className }
                style={ handStyle }
                onDragLeave={ handleDragLeave }
                onDragOver={ handleDragOver }
                onDrop={ (event) => handleDragDrop(event, 'hand') }
            >
                { handCards }
            </div>
        </div>
    );
}

PlayerHand.displayName = 'PlayerHand';
PlayerHand.propTypes = {
    cardSize: PropTypes.string,
    cards: PropTypes.array,
    isMe: PropTypes.bool,
    onCardClick: PropTypes.func,
    onDragDrop: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func
};

export default PlayerHand;
