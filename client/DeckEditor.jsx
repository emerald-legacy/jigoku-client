import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import $ from 'jquery';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';

import Input from './FormComponents/Input.jsx';
import Select from './FormComponents/Select.jsx';
import Typeahead from './FormComponents/Typeahead.jsx';
import TextArea from './FormComponents/TextArea.jsx';

import * as actions from './actions';

class InnerDeckEditor extends React.Component {
    constructor(props) {
        super(props);

        this.onImportDeckClick = this.onImportDeckClick.bind(this);

        this.state = {
            cardList: '',
            deck: this.copyDeck(props.deck),
            numberToAdd: 1,
            validation: {
                deckname: '',
                cardToAdd: ''
            }
        };
    }

    componentWillMount() {
        let deck = this.copyDeck(this.state.deck);
        let updatedDefaultFields = false;
        if(!this.props.deck.faction && this.props.factions) {
            deck.faction = this.props.factions['crab'];
            deck.alliance = { name: '', value: '' };
            updatedDefaultFields = true;
        }
        if(!this.props.deck.format && this.props.formats) {
            deck.format = this.props.formats['emerald'];
            updatedDefaultFields = true;
        }
        if(updatedDefaultFields) {
            this.setState({ deck: deck });
            this.props.updateDeck(deck);
        }
        let cardList = '';

        if(this.props.deck && (this.props.deck.stronghold || this.props.deck.role || this.props.deck.provinceCards ||
                this.props.deck.conflictCards || this.props.deck.dynastyCards)) {
            _.each(this.props.deck.stronghold, card => {
                cardList += this.getCardListEntry(card.count, card.card, card.pack_id);
            });

            _.each(this.props.deck.role, card => {
                cardList += this.getCardListEntry(card.count, card.card, card.pack_id);
            });

            _.each(this.props.deck.conflictCards, card => {
                cardList += this.getCardListEntry(card.count, card.card, card.pack_id);
            });

            _.each(this.props.deck.dynastyCards, card => {
                cardList += this.getCardListEntry(card.count, card.card, card.pack_id);
            });

            _.each(this.props.deck.provinceCards, card => {
                cardList += this.getCardListEntry(card.count, card.card, card.pack_id);
            });

            this.setState({ cardList: cardList });
        }
    }

    // XXX One could argue this is a bit hacky, because we're updating the innards of the deck object, react doesn't update components that use it unless we change the reference itself
    copyDeck(deck, clearStatus = false) {
        if(!deck) {
            return { name: 'New Deck'};
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

    onChange(field, event) {
        let deck = this.copyDeck(this.state.deck);

        deck[field] = event.target.value;

        this.setState({ deck: deck });
        this.props.updateDeck(deck);
    }

    onNumberToAddChange(event) {
        this.setState({ numberToAdd: event.target.value });
    }

    onFormatChange(selectedFormat) {
        let deck = this.copyDeck(this.state.deck, true);

        deck.format = selectedFormat;

        this.setState({ deck: deck });
        this.props.updateDeck(deck);
    }

    onFactionChange(selectedFaction) {
        let deck = this.copyDeck(this.state.deck, true);

        deck.faction = selectedFaction;

        this.setState({ deck: deck });
        this.props.updateDeck(deck);
    }

    onAllianceChange(selectedAlliance) {
        let deck = this.copyDeck(this.state.deck, true);

        if(!selectedAlliance) {
            deck.alliance = { name: '', value: '' };
        } else {
            deck.alliance = selectedAlliance;
        }

        this.setState({ deck: deck, showAlliance: deck.alliance }); // Alliance
        this.props.updateDeck(deck);
    }

    addCardChange(selectedCards) {
        this.setState({ cardToAdd: selectedCards[0] });
    }

    onAddCard(event) {
        event.preventDefault();

        if(!this.state.cardToAdd || !this.state.cardToAdd.name) {
            return;
        }

        // Get the default pack_id from the first version (if available)
        let defaultPackId;
        if(this.state.cardToAdd.versions && this.state.cardToAdd.versions.length > 0) {
            defaultPackId = this.state.cardToAdd.versions[0].pack_id;
        }

        let cardList = this.state.cardList;
        cardList += this.getCardListEntry(this.state.numberToAdd, this.state.cardToAdd, defaultPackId);

        this.addCard(this.state.cardToAdd, parseInt(this.state.numberToAdd), defaultPackId);
        this.setState({ cardList: cardList });
        let deck = this.state.deck;

        deck = this.copyDeck(deck, true);

        this.props.updateDeck(deck);
    }

    onCardListChange(event) {
        let deck = this.state.deck;
        let split = event.target.value.split('\n');

        deck.stronghold = [];
        deck.role = [];
        deck.provinceCards = [];
        deck.conflictCards = [];
        deck.dynastyCards = [];

        _.each(split, line => {
            line = line.trim();
            let index = 2;

            if(!$.isNumeric(line[0])) {
                return;
            }

            let num = parseInt(line[0]);
            if(line[1] === 'x') {
                index++;
            }

            let packOffset = line.indexOf('(');
            let cardName = line.substr(index, packOffset === -1 ? line.length : packOffset - index - 1);
            let packName = packOffset > -1 ? line.substr(packOffset + 1, line.length - packOffset - 2) : '';

            let pack = _.find(this.props.packs, function(pack) {
                return pack.id.toLowerCase() === packName.toLowerCase() || pack.name.toLowerCase() === packName.toLowerCase();
            });

            let card = _.find(this.props.cards, function(card) {
                if(pack && card.versions.length) {
                    if(card.name.toLowerCase() === cardName.toLowerCase()) {
                        return _.find(card.versions, function(packCard) {
                            return packCard.pack_id === pack.id;
                        });
                    }
                    return false;
                }
                return card.name.toLowerCase() === cardName.toLowerCase();
            });

            if(card) {
                // Use specified pack or default to first version's pack
                let packId = pack ? pack.id : (card.versions && card.versions.length > 0 ? card.versions[0].pack_id : undefined);
                this.addCard(card, num, packId);
            }
        });

        deck = this.copyDeck(deck, true);

        this.setState({ cardList: event.target.value, deck: deck }); // Alliance
        this.props.updateDeck(deck);
    }

    addCard(card, number, packId) {
        let deck = this.copyDeck(this.state.deck);
        let provinces = deck.provinceCards;
        let stronghold = deck.stronghold;
        let role = deck.role;
        let conflict = deck.conflictCards;
        let dynasty = deck.dynastyCards;

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

        // Find existing entry for this card with the same pack
        let existingEntry = _.find(list, entry => entry.card.id === card.id && entry.pack_id === packId);
        if(existingEntry) {
            existingEntry.count += number;
        } else {
            list.push({ count: number, card: card, pack_id: packId });
        }
    }

    onSaveClick(event) {
        event.preventDefault();

        if(this.props.onDeckSave) {
            this.props.onDeckSave(this.props.deck);
        }
    }

    onImportDeckClick() {
        $(findDOMNode(this.refs.modal)).modal('show');
    }

    getCardListEntry(count, card, packId) {
        if(!card) {
            return '';
        }
        let packName = '';
        if(card.versions && card.versions.length) {
            // Use the provided packId if available, otherwise fall back to first version
            let packData = packId
                ? _.find(card.versions, v => v.pack_id === packId) || card.versions[0]
                : card.versions[0];
            let pack = _.find(this.props.packs, p => p.id === packData.pack_id);
            if(pack && pack.name) {
                packName = ' (' + pack.name + ')';
            }
        }
        return count + ' ' + card.name + packName + '\n';
    }

    importDeck() {
        $(findDOMNode(this.refs.modal)).modal('hide');
        let importUrl = document.getElementById('importUrl').value;
        if(importUrl.includes('fiveringsdb.com')) {
            this.importDeck5rdb();
            return;
        }

        let emeraldUrl = importUrl.replace('/decks', '/api/decklists');
        let deckResponse = {};

        $.ajax({
            type: 'GET',
            url: emeraldUrl,
            dataType: 'json',
            async: false,
            success: function(data) {
                deckResponse = data;
            }
        });

        let deckClan = '';
        let deckAlliance = '';
        let deckName = '';
        let deckList = '';
        let cardList = '';
        let deckFormat = '';

        if(deckResponse) {
            deckClan = deckResponse.primary_clan;
            deckAlliance = deckResponse.secondary_clan;
            deckName = deckResponse.name;
            deckList = deckResponse.cards;
            deckFormat = deckResponse.format;

            let deck = this.copyDeck(this.state.deck);

            deck.name = deckName;
            if(deckClan) {
                deck.faction = this.props.factions[deckClan];
            } else {
                deck.faction = this.props.factions['crab'];
            }

            if(deckAlliance) {
                deck.alliance = this.props.factions[deckAlliance];
            } else {
                deck.alliance = { name: '', value: '' };
            }

            if(deckFormat) {
                if(deckFormat === 'standard') {
                    deckFormat = 'stronghold';
                }
                deck.format = this.props.formats[deckFormat] || this.props.formats['emerald'];
            }

            // Initialize card arrays
            deck.stronghold = [];
            deck.role = [];
            deck.provinceCards = [];
            deck.conflictCards = [];
            deck.dynastyCards = [];

            _.each(deckList, (count, id) => {
                const card = this.props.cards[id];
                if(card) {
                    cardList += this.getCardListEntry(count, card);
                }
            });

            //Duplicate onCardListChange to get this working correctly
            let split = cardList.split('\n');
            _.each(split, line => {
                line = line.trim();
                let index = 2;

                if(!$.isNumeric(line[0])) {
                    return;
                }

                let num = parseInt(line[0]);
                if(line[1] === 'x') {
                    index++;
                }

                let packOffset = line.indexOf('(');
                let cardName = line.substr(index, packOffset === -1 ? line.length : packOffset - index - 1);
                let packName = packOffset > -1 ? line.substr(packOffset + 1, line.length - packOffset - 2) : '';

                let pack = _.find(this.props.packs, function(pack) {
                    return pack.id.toLowerCase() === packName.toLowerCase() || pack.name.toLowerCase() === packName.toLowerCase();
                });

                let card = _.find(this.props.cards, function(card) {
                    if(pack && card.versions.length) {
                        return card.name.toLowerCase() === cardName.toLowerCase() && _.any(card.versions, data => data.pack_id === pack.id);
                    }
                    return card.name.toLowerCase() === cardName.toLowerCase();
                });

                if(card) {
                    //Duplicate addCard as well
                    let provinces = deck.provinceCards;
                    let stronghold = deck.stronghold;
                    let role = deck.role;
                    let conflict = deck.conflictCards;
                    let dynasty = deck.dynastyCards;
                    // Use specified pack or default to first version's pack
                    let packId = pack ? pack.id : (card.versions && card.versions.length > 0 ? card.versions[0].pack_id : undefined);

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

                    let existingEntry = _.find(list, entry => entry.card.id === card.id && entry.pack_id === packId);
                    if(existingEntry) {
                        existingEntry.count += num;
                    } else {
                        list.push({ count: num, card: card, pack_id: packId });
                    }
                }
            });


            this.setState({cardList: cardList, deck: deck, showAlliance: deck.alliance });
            this.props.updateDeck(deck);

        }
    }

    importDeck5rdb() {
        $(findDOMNode(this.refs.modal)).modal('hide');

        let importUrl = document.getElementById('importUrl').value;

        let apiUrl = 'https://api.fiveringsdb.com/';
        let strainPath = 'strains';
        let deckPath = 'decks';
        let deckResponse = {};

        let importId = String(importUrl).split('/')[4];
        let selector = String(importUrl).split('/')[3];

        let path = '';
        if(selector === 'decks') {
            path = deckPath;
        } else if(selector === 'strains') {
            path = strainPath;
        }

        $.ajax({
            type: 'GET',
            url: apiUrl + path + '/' + importId,
            dataType: 'json',
            async: false,
            success: function(data) {
                deckResponse = data;
            }
        });

        let deckClan = '';
        let deckAlliance = '';
        let deckName = '';
        let deckList = '';
        let cardList = '';
        let deckFormat = '';

        if(deckResponse.success) {
            let deckRecord = deckResponse.record;
            if(selector === 'decks') {
                deckClan = deckRecord.primary_clan;
                deckAlliance = deckRecord.secondary_clan;
                deckName = deckRecord.name;
                deckList = deckRecord.cards;
                deckFormat = deckRecord.format;
            } else if(selector === 'strains') {
                deckClan = deckRecord.head.primary_clan;
                deckAlliance = deckRecord.head.secondary_clan;
                deckName = deckRecord.head.name;
                deckList = deckRecord.head.cards;
                deckFormat = deckRecord.head.format;
            }

            let deck = this.copyDeck(this.state.deck);

            deck.name = deckName;
            if(deckClan) {
                deck.faction = this.props.factions[deckClan];
            } else {
                deck.faction = this.props.factions['crab'];
            }

            if(deckAlliance) {
                deck.alliance = this.props.factions[deckAlliance];
            } else {
                deck.alliance = { name: '', value: '' };
            }

            if(deckFormat) {
                if(deckFormat === 'standard') {
                    deckFormat = 'stronghold';
                }
                deck.format = this.props.formats[deckFormat] || this.props.formats['stronghold'];
            }

            // Initialize card arrays
            deck.stronghold = [];
            deck.role = [];
            deck.provinceCards = [];
            deck.conflictCards = [];
            deck.dynastyCards = [];

            _.each(deckList, (count, id) => {
                const card = this.props.cards[id];
                if(card) {
                    cardList += this.getCardListEntry(count, card);
                }
            });

            //Duplicate onCardListChange to get this working correctly
            let split = cardList.split('\n');
            _.each(split, line => {
                line = line.trim();
                let index = 2;

                if(!$.isNumeric(line[0])) {
                    return;
                }

                let num = parseInt(line[0]);
                if(line[1] === 'x') {
                    index++;
                }

                let packOffset = line.indexOf('(');
                let cardName = line.substr(index, packOffset === -1 ? line.length : packOffset - index - 1);
                let packName = packOffset > -1 ? line.substr(packOffset + 1, line.length - packOffset - 2) : '';

                let pack = _.find(this.props.packs, function(pack) {
                    return pack.id.toLowerCase() === packName.toLowerCase() || pack.name.toLowerCase() === packName.toLowerCase();
                });

                let card = _.find(this.props.cards, function(card) {
                    if(pack && card.versions.length) {
                        return card.name.toLowerCase() === cardName.toLowerCase() && _.any(card.versions, data => data.pack_id === pack.id);
                    }
                    return card.name.toLowerCase() === cardName.toLowerCase();
                });

                if(card) {
                    //Duplicate addCard as well
                    let provinces = deck.provinceCards;
                    let stronghold = deck.stronghold;
                    let role = deck.role;
                    let conflict = deck.conflictCards;
                    let dynasty = deck.dynastyCards;
                    // Use specified pack or default to first version's pack
                    let packId = pack ? pack.id : (card.versions && card.versions.length > 0 ? card.versions[0].pack_id : undefined);

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

                    let existingEntry = _.find(list, entry => entry.card.id === card.id && entry.pack_id === packId);
                    if(existingEntry) {
                        existingEntry.count += num;
                    } else {
                        list.push({ count: num, card: card, pack_id: packId });
                    }
                }
            });


            this.setState({cardList: cardList, deck: deck, showAlliance: deck.alliance });
            this.props.updateDeck(deck);

        }
    }

    render() {
        if(!this.props.deck || this.props.loading) {
            return <div>Waiting for deck...</div>;
        }

        let popup = (
            <div id='decks-modal' ref='modal' className='modal fade' tabIndex='-1' role='dialog'>
                <div className='modal-dialog' role='document'>
                    <div className='modal-content deck-popup'>
                        <div className='modal-header'>
                            <button type='button' className='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>×</span></button>
                            <h4 className='modal-title'>Provide Permalink</h4>
                        </div>
                        <div className='modal-body'>
                            <Input name='importUrl' fieldClass='col-sm-9' placeholder='Permalink' type='text' >
                                <div className='col-sm-1'>
                                    <button className='btn btn-default' onClick={ this.importDeck.bind(this) }>Import</button>
                                </div>
                            </Input>
                        </div>
                    </div>
                </div>
            </div>);

        return (
            <div>
                { popup }
                <span className='btn btn-primary' data-toggle='modal' data-target='#decks-modal'>Import deck</span>
                <h4>Either type the cards manually into the box below, add the cards one by one using the card box and autocomplete or for best results, copy the permalink url from <a href='https://www.emeralddb.org' target='_blank'>Emerald DB</a> and paste it into the popup from clicking the "Import Deck" button.</h4>
                <form className='form form-horizontal'>
                    <Input name='deckName' label='Deck Name' labelClass='col-sm-3' fieldClass='col-sm-9' placeholder='Deck Name'
                        type='text' onChange={ this.onChange.bind(this, 'name') } value={ this.state.deck.name } />
                    <Select name='format' label='Format' labelClass='col-sm-3' fieldClass='col-sm-9' options={ _.toArray(this.props.formats) }
                        onChange={ this.onFormatChange.bind(this) } value={ this.state.deck.format ? this.state.deck.format.value : 'emerald' } />
                    <Select name='faction' label='Clan' labelClass='col-sm-3' fieldClass='col-sm-9' options={ _.toArray(this.props.factions) }
                        onChange={ this.onFactionChange.bind(this) } value={ this.state.deck.faction ? this.state.deck.faction.value : undefined } />
                    <Select name='alliance' label='Alliance' labelClass='col-sm-3' fieldClass='col-sm-9' options={ _.toArray(this.props.alliances) }
                        onChange={ this.onAllianceChange.bind(this) } value={ this.state.deck.alliance ? this.state.deck.alliance.value : undefined }
                        valueKey='value' nameKey='name' blankOption={ { name: '- Select -', value: '' } } />

                    <Typeahead label='Card' labelClass={ 'col-sm-3' } fieldClass='col-sm-4' labelKey={ 'name' } options={ _.toArray(this.props.cards) }
                        onChange={ this.addCardChange.bind(this) }>
                        <Input name='numcards' type='text' label='Num' labelClass='col-sm-1' fieldClass='col-sm-2'
                            value={ this.state.numberToAdd.toString() } onChange={ this.onNumberToAddChange.bind(this) }>
                            <div className='col-sm-1'>
                                <button className='btn btn-primary add-card-button' onClick={ this.onAddCard.bind(this) }>Add</button>
                            </div>
                        </Input>
                    </Typeahead>
                    <TextArea label='Cards' labelClass='col-sm-3' fieldClass='col-sm-9' rows='10' value={ this.state.cardList }
                        onChange={ this.onCardListChange.bind(this) } />
                    <div className='form-group'>
                        <div className='col-sm-offset-3 col-sm-8'>
                            <button ref='submit' type='submit' className='btn btn-primary' onClick={ this.onSaveClick.bind(this) }>Save Deck</button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }
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
