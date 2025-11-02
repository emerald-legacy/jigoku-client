const logger = require('../log.js');

class DeckService {
    constructor(db) {
        this.decks = db.get('decks');
    }

    getById(id) {
        return this.decks.findOne({ _id: id })
            .catch(err => {
                logger.error('Unable to fetch deck', err);
                throw new Error('Unable to fetch deck ' + id);
            });
    }

    findByUserName(userName, options = {}) {
        let query = { username: userName };

        // Add format filter if provided
        if(options.format) {
            query['format.value'] = options.format;
        }

        return this.decks.find(query, { sort: { lastUpdated: -1 } });
    }

    countByUserName(userName) {
        return this.decks.count({ username: userName });
    }

    create(deck) {
        let properties = {
            username: deck.username,
            name: deck.deckName,
            provinceCards: deck.provinceCards,
            stronghold: deck.stronghold,
            role: deck.role,
            conflictCards: deck.conflictCards,
            dynastyCards: deck.dynastyCards,
            faction: deck.faction,
            alliance: deck.alliance,
            format: deck.format,
            lastUpdated: new Date()
        };

        return this.decks.insert(properties);
    }

    update(deck) {
        let properties = {
            name: deck.deckName,
            provinceCards: deck.provinceCards,
            stronghold: deck.stronghold,
            role: deck.role,
            conflictCards: deck.conflictCards,
            dynastyCards: deck.dynastyCards,
            faction: deck.faction,
            alliance: deck.alliance,
            format: deck.format,
            lastUpdated: new Date()
        };

        return this.decks.update({ _id: deck.id }, { '$set': properties });
    }

    delete(id) {
        return this.decks.remove({ _id: id });
    }
}

module.exports = DeckService;

