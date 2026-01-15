import { useState } from 'react';
import PropTypes from 'prop-types';

import Typeahead from '../FormComponents/Typeahead.jsx';

function CardNameLookup({ cards, onCardSelected }) {
    const [cardName, setCardName] = useState(null);

    const onCardNameChange = (card) => {
        setCardName(card[0]);
    };

    const onDoneClick = () => {
        if (onCardSelected) {
            onCardSelected(cardName);
        }
    };

    const cardOptions = [...new Set(Object.values(cards).map((card) => card.name))];

    return (
        <div>
            <Typeahead labelKey='label' options={cardOptions} dropup onChange={onCardNameChange} />
            <button
                type='button'
                disabled={!cardName}
                onClick={onDoneClick}
                className='btn btn-primary'
            >
                Done
            </button>
        </div>
    );
}

CardNameLookup.displayName = 'CardNameLookup';
CardNameLookup.propTypes = {
    cards: PropTypes.object,
    onCardSelected: PropTypes.func
};

export default CardNameLookup;
