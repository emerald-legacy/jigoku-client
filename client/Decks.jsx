import { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import DeckSummary from './DeckSummary.jsx';
import Link from './Link.jsx';
import DeckRow from './DeckRow.jsx';

import * as actions from './actions';

export function InnerDecks({
    apiError,
    cards,
    clearDeckStatus,
    deckDeleted,
    deckStats,
    decks,
    deleteDeck,
    deleteDecks,
    loadDeckStats,
    loadDecksWithLazyValidation,
    loading,
    navigate,
    selectDeck,
    selectedDeck
}) {
    const [showDelete, setShowDelete] = useState(false);
    const [selectedDeckIds, setSelectedDeckIds] = useState([]);
    const [showDeleteSelected, setShowDeleteSelected] = useState(false);

    useEffect(() => {
        loadDecksWithLazyValidation();
        loadDeckStats();
    }, [loadDecksWithLazyValidation, loadDeckStats]);

    useEffect(() => {
        if(deckDeleted) {
            const timer = setTimeout(() => {
                clearDeckStatus();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [deckDeleted, clearDeckStatus]);

    const handleDeleteClick = (event) => {
        event.preventDefault();
        setShowDelete(prev => !prev);
    };

    const handleEditClick = (event) => {
        event.preventDefault();
        navigate('/decks/edit');
    };

    const handleConfirmDeleteClick = (event) => {
        event.preventDefault();
        deleteDeck(selectedDeck);
        setShowDelete(false);
    };

    const handleToggleSelectAll = (event) => {
        if(event.target.checked) {
            const allDeckIds = decks.map(deck => deck._id);
            setSelectedDeckIds(allDeckIds);
        } else {
            setSelectedDeckIds([]);
        }
    };

    const handleToggleSelectDeck = (deckId) => {
        setSelectedDeckIds(prev => {
            const index = prev.indexOf(deckId);
            if(index === -1) {
                return [...prev, deckId];
            }
            return prev.filter(id => id !== deckId);

        });
    };

    const handleDeleteSelectedClick = (event) => {
        event.preventDefault();
        setShowDeleteSelected(prev => !prev);
    };

    const handleConfirmDeleteSelectedClick = (event) => {
        event.preventDefault();
        if(selectedDeckIds.length > 0) {
            deleteDecks(selectedDeckIds);
            setShowDeleteSelected(false);
            setSelectedDeckIds([]);
        }
    };

    let content = null;

    if(loading) {
        content = <div>Loading decks from the server...</div>;
    } else if(apiError) {
        content = <AlertPanel type='error' message={ apiError } />;
    } else {
        const deckCount = decks ? decks.length : 0;
        const isAtLimit = deckCount >= 50;
        const isNearLimit = deckCount >= 45 && deckCount < 50;

        let limitWarning = null;
        if(isAtLimit) {
            limitWarning = (
                <AlertPanel type='warning' message='You have reached the maximum limit of 50 decks. Please delete some decks before creating new ones.' />
            );
        } else if(isNearLimit) {
            limitWarning = (
                <AlertPanel type='info' message={ `You have ${deckCount} out of 50 decks. Consider deleting unused decks.` } />
            );
        }

        let successPanel = null;
        if(deckDeleted) {
            successPanel = (
                <AlertPanel message='Deck deleted successfully' type='success' />
            );
        }

        const deckList = decks ? decks.map((deck, index) => (
            <DeckRow
                key={ deck.name + index.toString() }
                deck={ deck }
                onClick={ () => selectDeck(deck) }
                active={ selectedDeck && deck._id === selectedDeck._id }
                showCheckbox
                isSelected={ selectedDeckIds.includes(deck._id) }
                onCheckboxChange={ handleToggleSelectDeck }
            />
        )) : [];

        let deckInfo = null;
        if(selectedDeck) {
            deckInfo = (
                <div className="col-sm-7">
                    <div className="panel-title text-center">
                        { selectedDeck.name }
                    </div>
                    <div className="panel">
                        <div className="btn-group">
                            <button className="btn btn-primary" onClick={ handleEditClick }>Edit</button>
                            <button className="btn btn-primary" onClick={ handleDeleteClick }>Delete</button>
                            { showDelete && (
                                <button className="btn btn-danger" onClick={ handleConfirmDeleteClick }>Delete</button>
                            ) }
                        </div>
                        <DeckSummary deck={ selectedDeck } cards={ cards } stats={ deckStats && selectedDeck ? deckStats[selectedDeck._id] : undefined } />
                    </div>
                </div>
            );
        }

        content = (
            <div className="full-height">
                { successPanel }
                { limitWarning }
                <div className="row h-full">
                    <div className="col-sm-5 full-height relative">
                        <div className="panel-title text-center">
                        Your decks ({ deckCount } / 50)
                        </div>
                        <div className="panel deck-list-container">
                            <div className="btn-group">
                                { isAtLimit ? (
                                    <button className="btn btn-primary" disabled title='Maximum deck limit reached'>New Deck</button>
                                ) : (
                                    <Link className="btn btn-primary" href='/decks/add'>New Deck</Link>
                                ) }
                                { selectedDeckIds.length > 0 && (
                                    <button className="btn btn-danger" onClick={ handleDeleteSelectedClick }>
                                    Delete Selected ({ selectedDeckIds.length })
                                    </button>
                                ) }
                                { showDeleteSelected && (
                                    <button className="btn btn-danger" onClick={ handleConfirmDeleteSelectedClick }>
                                    Confirm Delete
                                    </button>
                                ) }
                            </div>
                            { decks && decks.length > 0 && (
                                <div className="checkbox" style={ { marginTop: '10px', marginBottom: '10px' } }>
                                    <label>
                                        <input
                                            type='checkbox'
                                            checked={ selectedDeckIds.length === decks.length }
                                            onChange={ handleToggleSelectAll }
                                        />
                                    Select All
                                    </label>
                                </div>
                            ) }
                            <div className="deck-list" style={ { top: decks && decks.length > 0 ? '95px' : '55px' } }>
                                { !decks || decks.length === 0 ? 'You have no decks, try adding one.' : deckList }
                            </div>
                        </div>
                    </div>
                    { deckInfo }
                </div>
            </div>
        );
    }

    return content;
}

InnerDecks.displayName = 'Decks';

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        cards: state.cards.cards,
        deckDeleted: state.cards.deckDeleted,
        deckStats: state.cards.deckStats,
        decks: state.cards.decks,
        loading: state.api.loading,
        selectedDeck: state.cards.selectedDeck
    };
}

const Decks = connect(mapStateToProps, actions)(InnerDecks);

export default Decks;
