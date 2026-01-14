import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';

import DeckStatus from './DeckStatus.jsx';

class DeckSummary extends React.Component {
    constructor() {
        super();

        this.onCardMouseOut = this.onCardMouseOut.bind(this);
        this.onCardMouseOver = this.onCardMouseOver.bind(this);

        this.state = {
            cardToShow: ''
        };
    }

    onCardMouseOver(event, id, packId) {
        var cardToDisplay = _.filter(this.props.cards, card => {
            return id === card.id;
        });

        this.setState({ cardToShow: cardToDisplay[0], packIdToShow: packId });
    }

    onCardMouseOut() {
        this.setState({ cardToShow: undefined, packIdToShow: undefined });
    }

    getCardImagePath(card, packId) {
        if(!card) {
            return '';
        }
        // All images are stored as {id}-{packId}.jpg
        if(packId) {
            return '/img/cards/' + card.id + '-' + packId + '.jpg';
        }
        // Fallback: use first version's pack_id if available
        if(card.versions && card.versions.length > 0) {
            return '/img/cards/' + card.id + '-' + card.versions[0].pack_id + '.jpg';
        }
        return '/img/cards/' + card.id + '.jpg';
    }

    getCardsToRender() {
        let cardsToRender = [];
        let groupedCards = {};

        let combinedCards = _.union(this.props.deck.stronghold, this.props.deck.role, this.props.deck.provinceCards, this.props.deck.dynastyCards, this.props.deck.conflictCards);
        combinedCards = combinedCards.filter(card => !!card.card);
        _.each(combinedCards, (card) => {
            let type = card.card.type;

            if(type === 'character' || type === 'event') {
                type = card.card.side + ` ${type}` ;
            }
            if(!groupedCards[type]) {
                groupedCards[type] = [card];
            } else {
                groupedCards[type].push(card);
            }
        });

        _.each(groupedCards, (cardList, key) => {
            let cards = [];
            let count = 0;

            _.each(cardList, card => {
                const cardKey = card.pack_id ? card.card.id + '-' + card.pack_id : card.card.id;
                cards.push(<div key={ cardKey }><span>{ card.count + 'x ' }</span><span className='card-link' onMouseOver={ event => this.onCardMouseOver(event, card.card.id, card.pack_id) } onMouseOut={ this.onCardMouseOut }>{ card.card.name }</span></div>);
                count += parseInt(card.count);
            });

            cardsToRender.push(
                <div className='cards-no-break'>
                    <div className='card-group-title'>{ key + ' (' + count.toString() + ')' }</div>
                    <div key={ key } className='card-group'>{ cards }</div>
                </div>);
        });

        return cardsToRender;
    }

    getDeckCount(deck) {
        let count = 0;

        _.each(deck, function(card) {
            count += card.count;
        });

        return count;
    }

    render() {
        if(!this.props.deck) {
            return <div>Waiting for selected deck...</div>;
        }

        var cardsToRender = this.getCardsToRender();
        const provinceCount = this.getDeckCount(this.props.deck.provinceCards);
        const dynastyCount = this.getDeckCount(this.props.deck.dynastyCards);
        const conflictCount = this.getDeckCount(this.props.deck.conflictCards);

        return (
            <div className='deck-summary col-xs-12'>
                { this.state.cardToShow ? <img className='hover-image' src={ this.getCardImagePath(this.state.cardToShow, this.state.packIdToShow) } /> : null }
                <div className='decklist'>
                    <div className='col-xs-2 col-sm-3 no-x-padding'>{ this.props.deck.faction ? <img className='deck-mon img-responsive' src={ '/img/mons/' + this.props.deck.faction.value + '.png' } /> : null }</div>
                    <div className='col-xs-8 col-sm-6'>
                        <div className='info-row row'><span>Clan:</span>{ this.props.deck.faction ? <span className={ 'pull-right' }>{ this.props.deck.faction.name }</span> : null }</div>
                        <div className='info-row row' ref='alliance'><span>Alliance:</span>{ this.props.deck.alliance && this.props.deck.alliance.name ? <span className='pull-right'>{ this.props.deck.alliance.name }</span> : <span> None </span> }</div>
                        <div className='info-row row' ref='deckFormat'><span>Format:</span><span className='pull-right'>{ this.props.deck.format ? this.props.deck.format.name : 'Emerald' }</span></div>
                        <div className='info-row row' ref='provinceCount'><span>Province deck:</span><span className='pull-right'>{ provinceCount } cards</span></div>
                        <div className='info-row row' ref='dynastyDrawCount'><span>Dynasty Deck:</span><span className='pull-right'>{ dynastyCount } cards</span></div>
                        <div className='info-row row' ref='conflictDrawCount'><span>Conflict Deck:</span><span className='pull-right'>{ conflictCount } cards</span></div>
                        <div className='info-row row'><span>Validity:</span>
                            <DeckStatus className='pull-right' deck={ this.props.deck } />
                        </div>
                    </div>
                    <div className='col-xs-2 col-sm-3 no-x-padding'>{ this.props.deck.alliance && this.props.deck.alliance.value !== 'none' ? <img className='deck-alliance-mon img-responsive' src={ '/img/mons/' + this.props.deck.alliance.value + '.png' } /> : null }</div>
                </div>
                <div className='col-xs-12 no-x-padding'>
                    <div className='cards'>
                        { cardsToRender }
                    </div>
                </div>
            </div>);
    }
}

DeckSummary.displayName = 'DeckSummary';
DeckSummary.propTypes = {
    cards: PropTypes.object,
    deck: PropTypes.object
};

export default DeckSummary;
