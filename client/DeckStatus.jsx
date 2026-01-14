import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import StatusPopOver from './StatusPopOver.jsx';
import validateDeck from './deck-validator.js';
import * as actions from './actions';

class InnerDeckStatus extends React.Component {
    constructor() {
        super();
        this.state = {
            deckStatus: {}
        };
        this.validationTimeout = null;
    }

    componentDidMount() {
        this.getDeckStatus();
    }

    componentDidUpdate(prevProps) {
        if(!this.props.deck) {
            return;
        }

        // If deck ID changed, validate immediately
        if(!prevProps.deck || prevProps.deck._id !== this.props.deck._id) {
            this.clearValidationTimeout();
            this.getDeckStatus(this.props.deck);
            return;
        }

        // If deck content changed (same ID but different cards), debounce validation
        if(this.hasDeckContentChanged(prevProps.deck, this.props.deck)) {
            this.scheduleValidation(this.props.deck);
        }
    }

    componentWillUnmount() {
        this.clearValidationTimeout();
    }

    clearValidationTimeout() {
        if(this.validationTimeout) {
            clearTimeout(this.validationTimeout);
            this.validationTimeout = null;
        }
    }

    scheduleValidation(deck) {
        // Clear any pending validation
        this.clearValidationTimeout();

        // Schedule validation for 1 second after the last change
        this.validationTimeout = setTimeout(() => {
            this.getDeckStatus(deck, true);
        }, 1000);
    }

    hasDeckContentChanged(oldDeck, newDeck) {
        // Check if format changed (affects validation rules)
        if(oldDeck.format !== newDeck.format) {
            return true;
        }

        // Compare deck card lists to see if content changed
        const oldHash = this.getDeckHash(oldDeck);
        const newHash = this.getDeckHash(newDeck);
        return oldHash !== newHash;
    }

    getDeckHash(deck) {
        if(!deck) {
            return '';
        }

        // Create a simple hash of the deck contents
        let parts = [];
        const arrays = [
            { name: 's', arr: deck.stronghold },
            { name: 'r', arr: deck.role },
            { name: 'p', arr: deck.provinceCards },
            { name: 'd', arr: deck.dynastyCards },
            { name: 'c', arr: deck.conflictCards }
        ];

        arrays.forEach(({ name, arr }) => {
            if(arr && arr.length > 0) {
                arr.forEach(cardEntry => {
                    if(cardEntry.card) {
                        parts.push(`${name}:${cardEntry.card.id}:${cardEntry.count}`);
                    }
                });
            }
        });

        return parts.sort().join('|');
    }

    async getDeckStatus(deck = undefined, forceValidate = false) {
        if(!deck) {
            deck = this.props.deck;
        }
        // Only use cached status if not forcing validation
        if(deck.status && !forceValidate) {
            this.setState({
                deckStatus: deck.status
            });
            return;
        }
        this.setState({
            deckStatus: {
                valid: undefined,
                extendedStatus: ['Querying Validation Server']
            }
        });
        const gameMode = deck.format && deck.format.value ? deck.format.value : 'stronghold';
        const status = await validateDeck(deck, { includeExtendedStatus: true, gameMode });
        this.setState({
            deckStatus: status
        });

        // Update Redux store with validation result
        if(this.props.updateDeckStatus && deck._id) {
            this.props.updateDeckStatus(deck._id, status);
        }
    }

    render() {
        const status = this.state.deckStatus;
        let statusName;
        let className = 'deck-status';

        if(this.props.className) {
            className += ' ' + this.props.className;
        }

        if(status.valid) {
            statusName = 'Valid';
            className += ' valid';
        } else if(status.valid === false) {
            statusName = 'Invalid';
            className += ' invalid';
        } else {
            statusName = 'Validating';
            className += ' casual-play';
        }

        return (
            <span className={ className }>
                <StatusPopOver status={ statusName } show={ status.extendedStatus && status.extendedStatus.length !== 0 }>
                    <div>
                        { status.extendedStatus && status.extendedStatus.length !== 0 &&
                            <ul className='deck-status-errors'>
                                { status.extendedStatus.map((error, index) => <li key={ index }>{ error }</li>) }
                            </ul>
                        }
                    </div>
                </StatusPopOver>
            </span>);
    }
}

InnerDeckStatus.displayName = 'DeckStatus';
InnerDeckStatus.propTypes = {
    className: PropTypes.string,
    deck: PropTypes.object.isRequired,
    updateDeckStatus: PropTypes.func
};

function mapStateToProps() {
    return {};
}

const DeckStatus = connect(mapStateToProps, actions)(InnerDeckStatus);

export default DeckStatus;
