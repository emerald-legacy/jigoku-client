import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import { connect } from 'react-redux';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import DeckSummary from './DeckSummary.jsx';
import Link from './Link.jsx';
import DeckRow from './DeckRow.jsx';

import * as actions from './actions';

class InnerDecks extends React.Component {
    constructor() {
        super();

        this.onDeleteClick = this.onDeleteClick.bind(this);
        this.onConfirmDeleteClick = this.onConfirmDeleteClick.bind(this);
        this.onToggleSelectAll = this.onToggleSelectAll.bind(this);
        this.onToggleSelectDeck = this.onToggleSelectDeck.bind(this);
        this.onDeleteSelectedClick = this.onDeleteSelectedClick.bind(this);
        this.onConfirmDeleteSelectedClick = this.onConfirmDeleteSelectedClick.bind(this);

        this.state = {
            decks: [],
            showDelete: false,
            selectedDeckIds: [],
            showDeleteSelected: false
        };
    }

    componentDidMount() {
        this.props.loadDecksWithLazyValidation();
    }

    onDeleteClick(event) {
        event.preventDefault();

        this.setState({ showDelete: !this.state.showDelete });
    }

    onEditClick(event) {
        event.preventDefault();

        this.props.navigate('/decks/edit');
    }

    onConfirmDeleteClick(event) {
        event.preventDefault();

        this.props.deleteDeck(this.props.selectedDeck);

        this.setState({ showDelete: false });
    }

    onToggleSelectAll(event) {
        if(event.target.checked) {
            const allDeckIds = this.props.decks.map(deck => deck._id);
            this.setState({ selectedDeckIds: allDeckIds });
        } else {
            this.setState({ selectedDeckIds: [] });
        }
    }

    onToggleSelectDeck(deckId) {
        const selectedDeckIds = [...this.state.selectedDeckIds];
        const index = selectedDeckIds.indexOf(deckId);

        if(index === -1) {
            selectedDeckIds.push(deckId);
        } else {
            selectedDeckIds.splice(index, 1);
        }

        this.setState({ selectedDeckIds });
    }

    onDeleteSelectedClick(event) {
        event.preventDefault();
        this.setState({ showDeleteSelected: !this.state.showDeleteSelected });
    }

    onConfirmDeleteSelectedClick(event) {
        event.preventDefault();

        if(this.state.selectedDeckIds.length > 0) {
            this.props.deleteDecks(this.state.selectedDeckIds);
            this.setState({ showDeleteSelected: false, selectedDeckIds: [] });
        }
    }

    render() {
        var index = 0;
        var decks = _.map(this.props.decks, deck => {
            var row = (<DeckRow
                key={ deck.name + index.toString() }
                deck={ deck }
                onClick={ () => this.props.selectDeck(deck) }
                active={ this.props.selectedDeck && deck._id === this.props.selectedDeck._id }
                showCheckbox={ true }
                isSelected={ this.state.selectedDeckIds.includes(deck._id) }
                onCheckboxChange={ this.onToggleSelectDeck } />);

            index++;

            return row;
        });

        var deckList = (
            <div>
                { decks }
            </div>
        );

        var deckInfo = null;

        if(this.props.selectedDeck) {
            deckInfo = (<div className='col-sm-7'>
                <div className='panel-title text-center col-xs-12'>
                    { this.props.selectedDeck.name }
                </div>
                <div className='panel col-xs-12'>
                    <div className='btn-group col-xs-12'>
                        <button className='btn btn-primary' onClick={ this.onEditClick.bind(this) }>Edit</button>
                        <button className='btn btn-primary' onClick={ this.onDeleteClick }>Delete</button>
                        { this.state.showDelete ?
                            <button className='btn btn-danger' onClick={ this.onConfirmDeleteClick }>Delete</button> :
                            null }
                    </div>
                    <DeckSummary deck={ this.props.selectedDeck } cards={ this.props.cards } />
                </div>
            </div>);
        }

        let content = null;

        let successPanel = null;

        if(this.props.deckDeleted) {
            setTimeout(() => {
                this.props.clearDeckStatus();
            }, 5000);
            successPanel = (
                <AlertPanel message='Deck deleted successfully' type={ 'success' } />
            );
        }

        if(this.props.loading) {
            content = <div>Loading decks from the server...</div>;
        } else if(this.props.apiError) {
            content = <AlertPanel type='error' message={ this.props.apiError } />;
        } else {
            const deckCount = this.props.decks ? this.props.decks.length : 0;
            const isAtLimit = deckCount >= 50;
            const isNearLimit = deckCount >= 45 && deckCount < 50;

            let limitWarning = null;
            if(isAtLimit) {
                limitWarning = (
                    <AlertPanel type='warning' message={ `You have reached the maximum limit of 50 decks. Please delete some decks before creating new ones.` } />
                );
            } else if(isNearLimit) {
                limitWarning = (
                    <AlertPanel type='info' message={ `You have ${deckCount} out of 50 decks. Consider deleting unused decks.` } />
                );
            }

            content = (
                <div className='full-height'>
                    { successPanel }
                    { limitWarning }
                    <div className='col-sm-5 full-height'>
                        <div className='panel-title text-center'>
                            Your decks ({ deckCount } / 50)
                        </div>
                        <div className='panel deck-list-container'>
                            <div className='btn-group'>
                                { isAtLimit ?
                                    <button className='btn btn-primary' disabled title='Maximum deck limit reached'>New Deck</button> :
                                    <Link className='btn btn-primary' href='/decks/add'>New Deck</Link>
                                }
                                { this.state.selectedDeckIds.length > 0 && (
                                    <button className='btn btn-danger' onClick={ this.onDeleteSelectedClick }>
                                        Delete Selected ({ this.state.selectedDeckIds.length })
                                    </button>
                                )}
                                { this.state.showDeleteSelected && (
                                    <button className='btn btn-danger' onClick={ this.onConfirmDeleteSelectedClick }>
                                        Confirm Delete
                                    </button>
                                )}
                            </div>
                            { this.props.decks && this.props.decks.length > 0 && (
                                <div className='checkbox' style={{ marginTop: '10px', marginBottom: '10px' }}>
                                    <label>
                                        <input
                                            type='checkbox'
                                            checked={ this.state.selectedDeckIds.length === this.props.decks.length }
                                            onChange={ this.onToggleSelectAll }
                                        />
                                        Select All
                                    </label>
                                </div>
                            )}
                            <div className='deck-list' style={{ top: this.props.decks && this.props.decks.length > 0 ? '95px' : '55px' }}>{ !this.props.decks || this.props.decks.length === 0 ? 'You have no decks, try adding one.' : deckList }</div>
                        </div>
                    </div>
                    { deckInfo }
                </div>);
        }
        return content;
    }
}

InnerDecks.displayName = 'Decks';
InnerDecks.propTypes = {
    apiError: PropTypes.string,
    cards: PropTypes.object,
    clearDeckStatus: PropTypes.func,
    deckDeleted: PropTypes.bool,
    decks: PropTypes.array,
    deleteDeck: PropTypes.func,
    deleteDecks: PropTypes.func,
    loadDecks: PropTypes.func,
    loadDecksWithLazyValidation: PropTypes.func,
    loading: PropTypes.bool,
    navigate: PropTypes.func,
    selectDeck: PropTypes.func,
    selectedDeck: PropTypes.object
};

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        cards: state.cards.cards,
        deckDeleted: state.cards.deckDeleted,
        decks: state.cards.decks,
        loading: state.api.loading,
        selectedDeck: state.cards.selectedDeck
    };
}

const Decks = connect(mapStateToProps, actions)(InnerDecks);

export default Decks;
