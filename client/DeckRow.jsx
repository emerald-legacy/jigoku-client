import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

class DeckRow extends React.Component {
    getStatusName(status) {
        if(!status) {
            return 'Validating';
        }
        if(status.valid) {
            return 'Valid';
        } else if(status.valid === false) {
            return 'Invalid';
        }
        return 'Validating';
    }

    render() {
        const deckStatus = this.getStatusName(this.props.deck.status);
        const { showCheckbox, isSelected, onCheckboxChange } = this.props;

        return (
            <div className={ this.props.active ? 'deck-row active' : 'deck-row' } key={ this.props.deck.name }>
                { showCheckbox && (
                    <div className='col-xs-1' onClick={ (e) => e.stopPropagation() }>
                        <input
                            type='checkbox'
                            checked={ isSelected }
                            onChange={ () => onCheckboxChange(this.props.deck._id) }
                        />
                    </div>
                )}
                <div className={ showCheckbox ? 'col-xs-1 deck-image' : 'col-xs-1 deck-image' } onClick={ this.props.onClick }>
                    <img className='deck-sm-mon' src={ '/img/mons/' + this.props.deck.faction.value + '.png' } />
                </div>
                <span className={ showCheckbox ? 'col-xs-7 col-md-6 col-lg-8 deck-name' : 'col-xs-8 col-md-7 col-lg-9 deck-name' } onClick={ this.props.onClick }>
                    { this.props.deck.name }
                </span>
                <span className='col-xs-2 col-md-3 col-lg-2 deck-status-label text-right pull-right' onClick={ this.props.onClick }>
                    { deckStatus }
                </span>
                <div className='row small' onClick={ this.props.onClick }>
                    <span className='col-md-7 deck-factionalliance'>{ this.props.deck.faction.name }{ this.props.deck.alliance && this.props.deck.alliance.name ? <span>/{ this.props.deck.alliance.name }</span> : null }</span>
                    <span className='col-xs-4 col-md-3 deck-date text-right pull-right'>{ moment(this.props.deck.lastUpdated).format('Do MMM YYYY') }</span>
                </div>
            </div>);
    }
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
