import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight } from 'lucide-react';

function AbilityTargeting({ onMouseOut, onMouseOver, source, targets }) {
    const handleMouseOver = useCallback((event, card) => {
        if(card && !card.facedown && onMouseOver) {
            onMouseOver(card);
        }
    }, [onMouseOver]);

    const handleMouseOut = useCallback((event, card) => {
        if(card && onMouseOut) {
            onMouseOut(card);
        }
    }, [onMouseOut]);

    const getCardImagePath = useCallback((card) => {
        if(!card.id) {
            return '/img/cards/' + (card.isDynasty ? 'dynasty' : card.isConflict ? 'conflict' : 'province') + 'cardback.jpg';
        }
        if(card.packId) {
            return '/img/cards/' + card.id + '-' + card.packId + '.jpg';
        }
        return '/img/cards/' + card.id + '.jpg';
    }, []);

    const renderSimpleCard = useCallback((card) => {
        return (
            <div
                className='target-card vertical'
                onMouseOut={ (event) => handleMouseOut(event, card) }
                onMouseOver={ (event) => handleMouseOver(event, card) }
            >
                <img
                    className='target-card-image vertical'
                    alt={ card.name }
                    src={ getCardImagePath(card) }
                />
            </div>
        );
    }, [handleMouseOut, handleMouseOver, getCardImagePath]);

    const renderSimpleRing = useCallback((ring) => {
        return (
            <div className='ring-prompt'>
                <div className='ring no-highlight'>
                    <div className={ 'ring icon-element-' + ring.element + ' large' } />
                </div>
            </div>
        );
    }, []);

    const renderStringChoice = useCallback((string) => {
        return (
            <div className='target-card vertical'>
                { string }
            </div>
        );
    }, []);

    const targetCards = targets?.map((target, index) => {
        if(target.type === 'select') {
            return <span key={ index }>{ renderStringChoice(target.name) }</span>;
        } else if(target.type === 'ring') {
            return <span key={ index }>{ renderSimpleRing(target) }</span>;
        }
        return <span key={ index }>{ renderSimpleCard(target) }</span>;
    });

    let sourceElement;
    if(source.type) {
        sourceElement = source.type === 'ring' ? renderSimpleRing(source) : renderSimpleCard(source);
    } else {
        sourceElement = renderStringChoice(source.name);
    }

    return (
        <div className='prompt-control-targeting'>
            { sourceElement }
            { targetCards && targetCards.length > 0 ? <span className='targeting-arrow'><ArrowRight size={ 16 } /></span> : null }
            { targetCards && targetCards.length > 0 ? targetCards : null }
        </div>
    );
}

AbilityTargeting.displayName = 'AbilityTargeting';
AbilityTargeting.propTypes = {
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    source: PropTypes.object,
    targets: PropTypes.array
};

export default AbilityTargeting;
