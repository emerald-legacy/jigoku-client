import PropTypes from 'prop-types';
import classNames from 'classnames';
import Card from './Card.jsx';

function SquishableCardPanel({
    cardSize,
    cards,
    className,
    isMe,
    maxCards,
    onCardClick,
    onMouseOut,
    onMouseOver,
    showHand,
    source,
    spectating,
    title,
    username
}) {
    const disableMouseOver = (revealWhenHiddenTo) => {
        if(spectating && showHand) {
            return false;
        }

        if(revealWhenHiddenTo === username) {
            return false;
        }

        return !isMe;
    };

    const getCardSizeMultiplier = () => {
        switch(cardSize) {
            case 'small':
                return 0.8;
            case 'large':
                return 1.4;
            case 'x-large':
                return 2;
        }
        return 1;
    };

    const getCardDimensions = () => {
        const multiplier = getCardSizeMultiplier();
        return {
            width: 65 * multiplier,
            height: 91 * multiplier
        };
    };

    const getOverallDimensions = () => {
        const cardDimensions = getCardDimensions();
        return {
            width: (cardDimensions.width + 5) * maxCards,
            height: cardDimensions.height
        };
    };

    const getCards = (needsSquish) => {
        const overallDimensions = getOverallDimensions();
        const dimensions = getCardDimensions();

        let cardList = cards;
        let cardIndex = 0;
        const handLength = cardList ? cardList.length : 0;
        const cardWidth = dimensions.width;

        const requiredWidth = handLength * cardWidth;
        const overflow = requiredWidth - overallDimensions.width;
        const offset = overflow / (handLength - 1);

        if(!isMe) {
            cardList = [...cards].sort((a, b) => a.revealWhenHiddenTo - b.revealWhenHiddenTo);
        }

        const hand = cardList.map((card) => {
            const left = (cardWidth - offset) * cardIndex++;

            let style = {};
            if(needsSquish) {
                style = {
                    left: left + 'px'
                };
            }

            return (
                <Card
                    key={ card.uuid }
                    card={ card }
                    disableMouseOver={ disableMouseOver(card.revealWhenHiddenTo) }
                    onClick={ onCardClick }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    size={ cardSize }
                    style={ style }
                    source={ source }
                />
            );
        });

        return hand;
    };

    const dimensions = getOverallDimensions();
    const needsSquish = cards && cards.length > maxCards;
    const cardElements = getCards(needsSquish);

    const panelClassName = classNames('squishable-card-panel', className, {
        [cardSize]: cardSize !== 'normal',
        squish: needsSquish
    });

    const style = {
        width: dimensions.width + 'px',
        height: dimensions.height + 'px'
    };

    return (
        <div className={ panelClassName } style={ style }>
            { title && (
                <div className='panel-header'>{ `${title} (${cardElements.length})` }</div>
            ) }
            { cardElements }
        </div>
    );
}

SquishableCardPanel.displayName = 'SquishableCardPanel';
SquishableCardPanel.propTypes = {
    cardSize: PropTypes.string,
    cards: PropTypes.array,
    className: PropTypes.string,
    isMe: PropTypes.bool,
    maxCards: PropTypes.number,
    onCardClick: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    showHand: PropTypes.bool,
    source: PropTypes.string,
    spectating: PropTypes.bool,
    title: PropTypes.string,
    username: PropTypes.string
};

export default SquishableCardPanel;
