import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';

import Input from './FormComponents/Input.jsx';
import Select from './FormComponents/Select.jsx';
import Typeahead from './FormComponents/Typeahead.jsx';
import TextArea from './FormComponents/TextArea.jsx';

import * as actions from './actions';

function copyDeck(deck, clearStatus = false) {
    if(!deck) {
        return { name: 'New Deck' };
    }

    return {
        _id: deck._id,
        name: deck.name,
        stronghold: deck.stronghold,
        role: deck.role,
        provinceCards: deck.provinceCards,
        conflictCards: deck.conflictCards,
        dynastyCards: deck.dynastyCards,
        faction: deck.faction,
        format: deck.format,
        alliance: deck.alliance,
        status: clearStatus ? undefined : deck.status
    };
}

export function InnerDeckEditor({
    alliances,
    cards,
    deck: propDeck,
    factions,
    formats,
    loading,
    onDeckSave,
    packs,
    updateDeck
}) {
    const [cardList, setCardList] = useState('');
    const [deck, setDeck] = useState(copyDeck(propDeck));
    const [numberToAdd, setNumberToAdd] = useState(1);
    const [cardToAdd, setCardToAdd] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [importUrl, setImportUrl] = useState('');

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (event) => {
            if(event.key === 'Escape' && showModal) {
                setShowModal(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showModal]);

    const getCardListEntry = useCallback((count, card, packId) => {
        if(!card) {
            return '';
        }
        let packName = '';
        if(card.versions && card.versions.length) {
            const packData = packId
                ? card.versions.find(v => v.pack_id === packId) || card.versions[0]
                : card.versions[0];
            const pack = packs?.find(p => p.id === packData.pack_id);
            if(pack && pack.name) {
                packName = ' (' + pack.name + ')';
            }
        }
        return count + ' ' + card.name + packName + '\n';
    }, [packs]);

    useEffect(() => {
        let updatedDeck = copyDeck(deck);
        let updatedDefaultFields = false;
        if(!propDeck.faction && factions) {
            updatedDeck.faction = factions['crab'];
            updatedDeck.alliance = { name: '', value: '' };
            updatedDefaultFields = true;
        }
        if(!propDeck.format && formats) {
            updatedDeck.format = formats['emerald'];
            updatedDefaultFields = true;
        }
        if(updatedDefaultFields) {
            setDeck(updatedDeck);
            updateDeck(updatedDeck);
        }

        let list = '';
        if(propDeck && (propDeck.stronghold || propDeck.role || propDeck.provinceCards ||
            propDeck.conflictCards || propDeck.dynastyCards)) {
            propDeck.stronghold?.forEach(card => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.role?.forEach(card => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.conflictCards?.forEach(card => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.dynastyCards?.forEach(card => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.provinceCards?.forEach(card => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            setCardList(list);
        }
    }, []);

    const addCard = useCallback((card, number, packId, currentDeck) => {
        const deckCopy = copyDeck(currentDeck);
        const provinces = deckCopy.provinceCards || [];
        const stronghold = deckCopy.stronghold || [];
        const role = deckCopy.role || [];
        const conflict = deckCopy.conflictCards || [];
        const dynasty = deckCopy.dynastyCards || [];

        let list;
        if(card.type === 'province') {
            list = provinces;
        } else if(card.side === 'dynasty') {
            list = dynasty;
        } else if(card.side === 'conflict') {
            list = conflict;
        } else if(card.type === 'stronghold') {
            list = stronghold;
        } else {
            list = role;
        }

        const existingEntry = list.find(entry => entry.card.id === card.id && entry.pack_id === packId);
        if(existingEntry) {
            existingEntry.count += number;
        } else {
            list.push({ count: number, card: card, pack_id: packId });
        }

        deckCopy.stronghold = stronghold;
        deckCopy.role = role;
        deckCopy.provinceCards = provinces;
        deckCopy.conflictCards = conflict;
        deckCopy.dynastyCards = dynasty;

        return deckCopy;
    }, []);

    const handleChange = useCallback((field, event) => {
        const newDeck = copyDeck(deck);
        newDeck[field] = event.target.value;
        setDeck(newDeck);
        updateDeck(newDeck);
    }, [deck, updateDeck]);

    const handleNumberToAddChange = useCallback((event) => {
        setNumberToAdd(event.target.value);
    }, []);

    const handleFormatChange = useCallback((selectedFormat) => {
        const newDeck = copyDeck(deck, true);
        newDeck.format = selectedFormat;
        setDeck(newDeck);
        updateDeck(newDeck);
    }, [deck, updateDeck]);

    const handleFactionChange = useCallback((selectedFaction) => {
        const newDeck = copyDeck(deck, true);
        newDeck.faction = selectedFaction;
        setDeck(newDeck);
        updateDeck(newDeck);
    }, [deck, updateDeck]);

    const handleAllianceChange = useCallback((selectedAlliance) => {
        const newDeck = copyDeck(deck, true);
        if(!selectedAlliance) {
            newDeck.alliance = { name: '', value: '' };
        } else {
            newDeck.alliance = selectedAlliance;
        }
        setDeck(newDeck);
        updateDeck(newDeck);
    }, [deck, updateDeck]);

    const handleAddCardChange = useCallback((selectedCards) => {
        setCardToAdd(selectedCards[0]);
    }, []);

    const handleAddCard = useCallback((event) => {
        event.preventDefault();

        if(!cardToAdd || !cardToAdd.name) {
            return;
        }

        let defaultPackId;
        if(cardToAdd.versions && cardToAdd.versions.length > 0) {
            defaultPackId = cardToAdd.versions[0].pack_id;
        }

        let list = cardList;
        list += getCardListEntry(numberToAdd, cardToAdd, defaultPackId);

        const updatedDeck = addCard(cardToAdd, parseInt(numberToAdd), defaultPackId, deck);
        const clearedDeck = copyDeck(updatedDeck, true);

        setCardList(list);
        setDeck(clearedDeck);
        updateDeck(clearedDeck);
    }, [cardToAdd, numberToAdd, cardList, deck, addCard, getCardListEntry, updateDeck]);

    const handleCardListChange = useCallback((event) => {
        let currentDeck = copyDeck(deck);
        const split = event.target.value.split('\n');

        currentDeck.stronghold = [];
        currentDeck.role = [];
        currentDeck.provinceCards = [];
        currentDeck.conflictCards = [];
        currentDeck.dynastyCards = [];

        split.forEach(line => {
            line = line.trim();
            let index = 2;

            if(isNaN(parseInt(line[0]))) {
                return;
            }

            const num = parseInt(line[0]);
            if(line[1] === 'x') {
                index++;
            }

            const packOffset = line.indexOf('(');
            const cardName = line.substr(index, packOffset === -1 ? line.length : packOffset - index - 1);
            const packName = packOffset > -1 ? line.substr(packOffset + 1, line.length - packOffset - 2) : '';

            const pack = packs?.find(p =>
                p.id.toLowerCase() === packName.toLowerCase() || p.name.toLowerCase() === packName.toLowerCase()
            );

            const cardsArray = cards ? Object.values(cards) : [];
            const card = cardsArray.find(c => {
                if(pack && c.versions && c.versions.length) {
                    if(c.name.toLowerCase() === cardName.toLowerCase()) {
                        return c.versions.find(packCard => packCard.pack_id === pack.id);
                    }
                    return false;
                }
                return c.name.toLowerCase() === cardName.toLowerCase();
            });

            if(card) {
                const packId = pack ? pack.id : (card.versions && card.versions.length > 0 ? card.versions[0].pack_id : undefined);
                currentDeck = addCard(card, num, packId, currentDeck);
            }
        });

        currentDeck = copyDeck(currentDeck, true);
        setCardList(event.target.value);
        setDeck(currentDeck);
        updateDeck(currentDeck);
    }, [deck, cards, packs, addCard, updateDeck]);

    const handleSaveClick = useCallback((event) => {
        event.preventDefault();
        if(onDeckSave) {
            onDeckSave(propDeck);
        }
    }, [onDeckSave, propDeck]);

    const handleImportDeckClick = useCallback(() => {
        setShowModal(true);
    }, []);

    const handleModalClick = useCallback((event) => {
        if(event.target === event.currentTarget) {
            setShowModal(false);
        }
    }, []);

    const handleImportDeck = useCallback(async () => {
        setShowModal(false);
        const emeraldUrl = importUrl.replace('/decks', '/api/decklists');

        try {
            const response = await axios.get(emeraldUrl);
            const deckResponse = response.data;

            if(!deckResponse) {
                return;
            }

            let newDeck = copyDeck(deck);
            newDeck.name = deckResponse.name || 'Imported Deck';
            newDeck.faction = factions[deckResponse.primary_clan] || factions['crab'];
            newDeck.alliance = deckResponse.secondary_clan
                ? factions[deckResponse.secondary_clan]
                : { name: '', value: '' };

            let deckFormat = deckResponse.format;
            if(deckFormat === 'standard') {
                deckFormat = 'stronghold';
            }
            newDeck.format = formats[deckFormat] || formats['emerald'];

            newDeck.stronghold = [];
            newDeck.role = [];
            newDeck.provinceCards = [];
            newDeck.conflictCards = [];
            newDeck.dynastyCards = [];

            let list = '';
            Object.entries(deckResponse.cards || {}).forEach(([id, count]) => {
                const card = cards[id];
                if(card) {
                    const packId = card.versions && card.versions.length > 0 ? card.versions[0].pack_id : undefined;
                    list += getCardListEntry(count, card, packId);

                    let targetList;
                    if(card.type === 'province') {
                        targetList = newDeck.provinceCards;
                    } else if(card.side === 'dynasty') {
                        targetList = newDeck.dynastyCards;
                    } else if(card.side === 'conflict') {
                        targetList = newDeck.conflictCards;
                    } else if(card.type === 'stronghold') {
                        targetList = newDeck.stronghold;
                    } else {
                        targetList = newDeck.role;
                    }
                    targetList.push({ count: count, card: card, pack_id: packId });
                }
            });

            setCardList(list);
            setDeck(newDeck);
            updateDeck(newDeck);
        } catch(error) {
            console.error('Failed to import deck:', error);
        }
    }, [importUrl, deck, factions, formats, cards, getCardListEntry, updateDeck]);

    const handleImportKeyPress = useCallback((event) => {
        if(event.key === 'Enter') {
            event.preventDefault();
            handleImportDeck();
        }
    }, [handleImportDeck]);

    const formatsArray = useMemo(() => formats ? Object.values(formats) : [], [formats]);
    const factionsArray = useMemo(() => factions ? Object.values(factions) : [], [factions]);
    const alliancesArray = useMemo(() => alliances ? Object.values(alliances) : [], [alliances]);
    const cardsArray = useMemo(() => cards ? Object.values(cards) : [], [cards]);

    if(!propDeck || loading) {
        return <div>Waiting for deck...</div>;
    }

    const popup = (
        <div
            className={ `modal fade ${showModal ? 'in' : ''}` }
            style={ { display: showModal ? 'block' : 'none' } }
            tabIndex='-1'
            role='dialog'
            onClick={ handleModalClick }
        >
            <div className='modal-dialog' role='document'>
                <div className='modal-content deck-popup'>
                    <div className='modal-header' style={ { padding: '10px 15px' } }>
                        <button type='button' className='close' aria-label='Close' onClick={ () => setShowModal(false) } style={ { fontSize: '24px', opacity: 1, color: '#fff', textShadow: 'none', marginTop: '-2px' } }>
                            <span aria-hidden='true'>&times;</span>
                        </button>
                        <h4 className='modal-title' style={ { margin: 0, fontSize: '16px' } }>Import from EmeraldDB</h4>
                    </div>
                    <div className='modal-body' style={ { padding: '10px 15px' } }>
                        <p style={ { margin: '0 0 8px 0', fontSize: '13px' } }>Paste the permalink URL from EmeraldDB:</p>
                        <div style={ { display: 'flex', gap: '8px', alignItems: 'stretch' } }>
                            <input
                                className='form-control'
                                name='importUrl'
                                placeholder='https://www.emeralddb.org/decks/...'
                                type='text'
                                value={ importUrl }
                                onChange={ (e) => setImportUrl(e.target.value) }
                                onKeyPress={ handleImportKeyPress }
                                style={ { flex: 1, height: '34px' } }
                                autoFocus
                            />
                            <button className='btn btn-primary' onClick={ handleImportDeck } style={ { height: '34px', padding: '6px 16px' } }>Import</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const backdrop = showModal ? <div className='modal-backdrop fade in' onClick={ () => setShowModal(false) } /> : null;

    return (
        <div>
            { popup }
            { backdrop }
            <span className='btn btn-primary' onClick={ handleImportDeckClick }>Import deck</span>
            <h4>Either type the cards manually into the box below, add the cards one by one using the card box and autocomplete or for best results, copy the permalink url from <a href='https://www.emeralddb.org' target='_blank' rel='noreferrer'>Emerald DB</a> and paste it into the popup from clicking the "Import Deck" button.</h4>
            <form className='form form-horizontal'>
                <Input name='deckName' label='Deck Name' labelClass='col-sm-3' fieldClass='col-sm-9' placeholder='Deck Name'
                    type='text' onChange={ (e) => handleChange('name', e) } value={ deck.name } />
                <Select name='format' label='Format' labelClass='col-sm-3' fieldClass='col-sm-9' options={ formatsArray }
                    onChange={ handleFormatChange } value={ deck.format ? deck.format.value : 'emerald' } />
                <Select name='faction' label='Clan' labelClass='col-sm-3' fieldClass='col-sm-9' options={ factionsArray }
                    onChange={ handleFactionChange } value={ deck.faction ? deck.faction.value : undefined } />
                <Select name='alliance' label='Alliance' labelClass='col-sm-3' fieldClass='col-sm-9' options={ alliancesArray }
                    onChange={ handleAllianceChange } value={ deck.alliance ? deck.alliance.value : undefined }
                    valueKey='value' nameKey='name' blankOption={ { name: '- Select -', value: '' } } />

                <Typeahead label='Card' labelClass='col-sm-3' fieldClass='col-sm-4' labelKey='name' options={ cardsArray }
                    onChange={ handleAddCardChange }>
                    <Input name='numcards' type='text' label='Num' labelClass='col-sm-1' fieldClass='col-sm-2'
                        value={ numberToAdd.toString() } onChange={ handleNumberToAddChange }>
                        <div className='col-sm-1'>
                            <button className='btn btn-primary add-card-button' onClick={ handleAddCard }>Add</button>
                        </div>
                    </Input>
                </Typeahead>
                <TextArea label='Cards' labelClass='col-sm-3' fieldClass='col-sm-9' rows='10' value={ cardList }
                    onChange={ handleCardListChange } />
                <div className='form-group'>
                    <div className='col-sm-offset-3 col-sm-8'>
                        <button type='submit' className='btn btn-primary' onClick={ handleSaveClick }>Save Deck</button>
                    </div>
                </div>
            </form>
        </div>
    );
}

InnerDeckEditor.displayName = 'DeckEditor';
InnerDeckEditor.propTypes = {
    alliances: PropTypes.object,
    cards: PropTypes.object,
    deck: PropTypes.object,
    factions: PropTypes.object,
    formats: PropTypes.object,
    loading: PropTypes.bool,
    mode: PropTypes.string,
    onDeckSave: PropTypes.func,
    packs: PropTypes.array,
    updateDeck: PropTypes.func
};

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        alliances: state.cards.factions,
        cards: state.cards.cards,
        deck: state.cards.selectedDeck,
        decks: state.cards.decks,
        factions: state.cards.factions,
        formats: state.cards.formats,
        loading: state.api.loading,
        packs: state.cards.packs
    };
}

const DeckEditor = connect(mapStateToProps, actions)(InnerDeckEditor);

export default DeckEditor;
