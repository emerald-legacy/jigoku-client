import Card from './Card.jsx';
import { tryParseJSON } from '../util.js';

const EMPTY_STYLE = {};

function PlayerHand({ cardSize, cards, isMe, onCardClick, onDragDrop, onMouseOut, onMouseOver }) {
    const handleDragOver = (event) => {
        event.target.classList.add('highlight-panel');
        event.preventDefault();
    };

    const handleDragLeave = (event) => {
        event.target.classList.remove('highlight-panel');
    };

    const handleDragDrop = (event, target) => {
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
    };

    const getCardWidth = () => {
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
    };

    const cardWidth = getCardWidth();

    let maxWidth;
    switch(cardSize) {
        case 'small':
        case 'large':
        case 'x-large':
        case 'xxl':
            maxWidth = cardWidth * 7.5;
            break;
        default:
            maxWidth = 480;
    }

    const needsSquish = cards && cards.length * cardWidth > maxWidth;

    const handCards = (() => {
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
            let className = "";
            if(needsSquish) {
                className += " squish";
                if(cardIndex++ === handLength) {
                    className += " tail";
                    if(attachmentOffset > (480 / (cardWidth * handLength))) {
                        className += " nohide";
                    }
                }
            }

            return (
                <Card
                    key={ card.uuid }
                    card={ card }
                    className={ className }
                    style={ EMPTY_STYLE }
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
    })();

    let className = "panel hand";
    let titleBarClassName = "hand-title-bar no-highlight";

    if(cardSize !== 'normal') {
        className += ` ${cardSize}`;
        titleBarClassName += ` ${cardSize}`;
    }

    // Calculate dynamic width based on number of cards
    let handWidth = maxWidth;
    if(cards && !needsSquish) {
        handWidth = Math.max(cardWidth * cards.length, cardWidth);
    }

    if(needsSquish) {
        className += " squish";
    }

    const handStyle = { width: `${handWidth}px` };
    const titleBarStyle = { width: `${handWidth}px` };

    return (
        <div>
            <div className="grip">
                <div className={ titleBarClassName } style={ titleBarStyle }>
                    { `Hand (${handCards.length})` }
                </div>
            </div>
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

export default PlayerHand;
