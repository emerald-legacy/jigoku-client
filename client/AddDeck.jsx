import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import DeckSummary from './DeckSummary.jsx';
import DeckEditor from './DeckEditor.jsx';
import AlertPanel from './SiteComponents/AlertPanel.jsx';

import * as actions from './actions';

export class InnerAddDeck extends React.Component {
    constructor() {
        super();

        this.state = {
            error: '',
            faction: {},
            ready: false // Don't render DeckEditor until addDeck has been called
        };

        this.onAddDeck = this.onAddDeck.bind(this);
    }

    componentDidMount() {
        this.props.addDeck();
        // Now allow DeckEditor to render - it will see the fresh empty deck from Redux
        this.setState({ ready: true });
    }

    componentDidUpdate(prevProps) {
        if(!prevProps.deckSaved && this.props.deckSaved) {
            this.props.navigate('/decks');
        }
    }

    onAddDeck(deck) {
        this.props.saveDeck(deck);
    }

    render() {
        let content;

        if(this.props.loading || !this.state.ready) {
            content = <div>Loading decks from the server...</div>;
        } else if(this.props.apiError) {
            content = <AlertPanel type='error' message={ this.props.apiError } />;
        } else {
            content = (
                <div>
                    <div className='col-sm-6'>
                        <div className='panel-title text-center'>
                            Deck Editor
                        </div>
                        <div className='panel'>
                            <DeckEditor mode='Add' onDeckSave={ this.onAddDeck } />
                        </div>
                    </div>
                    <div className='col-sm-6'>
                        <div className='panel-title text-center col-xs-12'>
                            { this.props.deck ? this.props.deck.name : 'New Deck' }
                        </div>
                        <div className='panel col-xs-12'>
                            <DeckSummary cards={ this.props.cards } deck={ this.props.deck } />
                        </div>
                    </div>
                </div>);
        }

        return content;
    }
}

InnerAddDeck.displayName = 'InnerAddDeck';
InnerAddDeck.propTypes = {
    addDeck: PropTypes.func,
    agendas: PropTypes.object,
    apiError: PropTypes.string,
    cards: PropTypes.object,
    deck: PropTypes.object,
    deckSaved: PropTypes.bool,
    factions: PropTypes.object,
    formats: PropTypes.object,
    loading: PropTypes.bool,
    navigate: PropTypes.func,
    saveDeck: PropTypes.func
};

function mapStateToProps(state) {
    return {
        agendas: state.cards.factions,
        apiError: state.api.message,
        cards: state.cards.cards,
        deck: state.cards.selectedDeck,
        deckSaved: state.cards.deckSaved,
        factions: state.cards.factions,
        formats: state.cards.formats,
        loading: state.api.loading,
        socket: state.socket.socket
    };
}

const AddDeck = connect(mapStateToProps, actions)(InnerAddDeck);

export default AddDeck;
