
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

    const getStatusClass = (status) => {
        if(!status) {
            return 'casual-play';
        }
        if(status.valid) {
            return 'valid';
        } else if(status.valid === false) {
            return 'invalid';
        }
        return 'casual-play';
    };

    const deckStatus = getStatusName(deck.status);
    const statusClass = getStatusClass(deck.status);

    return (
        <div className={ `deck-row${active ? " active" : ""}` } key={ deck.name } onClick={ onClick }>
            { showCheckbox && (
                <div className="deck-row-checkbox" onClick={ (e) => e.stopPropagation() }>
                    <input
                        type='checkbox'
                        checked={ isSelected }
                        onChange={ () => onCheckboxChange(deck._id) }
                    />
                </div>
            ) }
            <div className="deck-row-clans">
                <img className="deck-clan-icon" src={ `/img/mons/${deck.faction.value}.png` } />
                { deck.alliance && deck.alliance.value ? (
                    <>
                        <span className="deck-clan-separator">/</span>
                        <img className="deck-clan-icon" src={ `/img/mons/${deck.alliance.value}.png` } />
                    </>
                ) : null }
            </div>
            <span className="deck-row-name">
                { deck.name }
            </span>
            <span className={ `deck-row-status ${statusClass}` }>
                { deckStatus }
            </span>
        </div>
    );
}

DeckRow.displayName = 'DeckRow';

export default DeckRow;
