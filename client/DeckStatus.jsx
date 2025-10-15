import React from 'react';
import PropTypes from 'prop-types';

import StatusPopOver from './StatusPopOver.jsx';
import validateDeck from './deck-validator.js';

class DeckStatus extends React.Component {
    constructor() {
        super();
        this.state = {
            deckStatus: {}
        };
    }

    componentDidMount() {
        this.getDeckStatus();
    }

    componentWillReceiveProps(props) {
        if(props.deck) {
            this.getDeckStatus(props.deck);
        }
    }

    async getDeckStatus(deck = undefined) {
        if(!deck) {
            deck = this.props.deck;
        }
        if(deck.status) {
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

DeckStatus.propTypes = {
    className: PropTypes.string,
    deck: PropTypes.object.isRequired
};

export default DeckStatus;
