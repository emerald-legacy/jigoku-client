const logger = require("../log.js");

class CardService {
    constructor(db) {
        this.cards = db.collection("cards");
        this.packs = db.collection("packs");
    }

    async replaceCards(cards) {
        await this.cards.deleteMany({});
        if(cards.length > 0) {
            await this.cards.insertMany(cards);
        }
    }

    async replacePacks(packs) {
        await this.packs.deleteMany({});
        if(packs.length > 0) {
            await this.packs.insertMany(packs);
        }
    }

    async getAllCards(options) {
        try {
            const result = await this.cards.find({}).toArray();
            const cards = {};

            result.forEach(card => {
                if(options && options.shortForm) {
                    // eslint-disable-next-line camelcase
                    const { id, name, type, clan, faction, side, deck_limit, elements, is_unique, influence_cost, influence_pool, versions, role_restriction, allowed_clans } = card;
                    // eslint-disable-next-line camelcase
                    cards[card.id] = { id, name, type, clan, faction, side, deck_limit, elements, is_unique, influence_cost, influence_pool, versions, role_restriction, allowed_clans };
                } else {
                    cards[card.id] = card;
                }
            });

            return cards;
        } catch(err) {
            logger.error(`Error fetching cards: ${err}`);
        }
    }

    async getAllPacks() {
        try {
            return await this.packs.find({}).toArray();
        } catch(err) {
            logger.error(`Error fetching packs: ${err}`);
        }
    }
}

module.exports = CardService;
