const logger = require('../log.js');

class CardService {
    constructor(db) {
        this.cards = db.get('cards');
        this.packs = db.get('packs');
    }

    replaceCards(cards) {
        return this.cards.remove({})
            .then(() => this.cards.insert(cards));
    }

    replacePacks(cards) {
        return this.packs.remove({})
            .then(() => this.packs.insert(cards));
    }

    getAllCards(options) {
        return this.cards.find({})
            .then(result => {
                let cards = {};

                result.forEach(card => {
                    if(options && options.shortForm) {
                        const { id, name, type, clan, faction, side, deck_limit, elements, is_unique, influence_cost, influence_pool, versions, role_restriction, allowed_clans } = card;
                        cards[card.id] = { id, name, type, clan, faction, side, deck_limit, elements, is_unique, influence_cost, influence_pool, versions, role_restriction, allowed_clans };
                    } else {
                        cards[card.id] = card;
                    }
                });

                return cards;
            }).catch(err => {
                logger.info(err);
            });
    }

    getAllPacks() {
        return this.packs.find({}).catch(err => {
            logger.info(err);
        });
    }
}

module.exports = CardService;

