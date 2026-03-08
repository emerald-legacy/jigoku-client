import PropTypes from 'prop-types';
import { format } from 'date-fns';

function DeckRow({ active, deck, isSelected, onCheckboxChange, onClick, showCheckbox }) {
    const getStatusName = (status) => {
        if(!status) {
            return 'Validating';
        }
        if(status.valid) {
            return 'Valid';
        } else if(status.valid === false) {
            return 'Invalid';
        }
        return 'Validating';
    };

    const deckStatus = getStatusName(deck.status);

    return (
        <div className={ active ? 'deck-row active' : 'deck-row' } key={ deck.name } onClick={ onClick }>
            { showCheckbox && (
                <div className='col-xs-1' onClick={ (e) => e.stopPropagation() }>
                    <input
                        type='checkbox'
                        checked={ isSelected }
                        onChange={ () => onCheckboxChange(deck._id) }
                    />
                </div>
            ) }
            <div className='col-xs-1 deck-image'>
                <img className='deck-sm-mon' src={ '/img/mons/' + deck.faction.value + '.png' } />
            </div>
            <span
                className={
                    showCheckbox
                        ? 'col-xs-7 deck-name'
                        : 'col-xs-8 deck-name'
                }
            >
                { deck.name }
            </span>
            <span className='col-xs-2 deck-status-label text-right ml-auto'>
                { deckStatus }
            </span>
            <div className='row small'>
                <span className='col-xs-7 deck-factionalliance'>
                    { deck.faction.name }
                    { deck.alliance && deck.alliance.name ? (
                        <span>/{ deck.alliance.name }</span>
                    ) : null }
                </span>
                <span className='col-xs-4 deck-date text-right ml-auto'>
                    { format(new Date(deck.lastUpdated), 'do MMM yyyy') }
                </span>
            </div>
        </div>
    );
}

DeckRow.displayName = 'DeckRow';
DeckRow.propTypes = {
    active: PropTypes.bool,
    deck: PropTypes.object,
    isSelected: PropTypes.bool,
    onCheckboxChange: PropTypes.func,
    onClick: PropTypes.func,
    showCheckbox: PropTypes.bool
};

export default DeckRow;
