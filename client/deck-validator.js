const $ = require('jquery'); // eslint-disable-line no-unused-vars
const _ = require('underscore');
const axios = require('axios').default;
const GameModes = require('./GameModes');

class ValidatorCache {

    constructor() {
    }

    updateCache(key, value) {
        if (typeof window === "undefined") {
            return;
        }

        const expiryTime = Date.now() + (1000 * 60 * 60 * 1); // 1 hour

        value.expiryTime = expiryTime;
        const json = JSON.stringify(value);

        localStorage.setItem(key, json);
    }

    getCache(key) {
        if (typeof window === "undefined") {
            return null;
        }

        const cachedValue = localStorage.getItem(key);
        if (!cachedValue) {
            return null;
        }

        const parsed = JSON.parse(cachedValue);
        if (!parsed.expiryTime) {
            localStorage.removeItem(key);
            return null;
        }
        if (parsed.expiryTime < Date.now()) {
            localStorage.removeItem(key);
            return null;
        }

        return parsed;
    }
}

class DeckValidator {
    constructor(packs, gameMode) {
        this.packs = packs;
        this.gameMode = gameMode;
        this.cache = new ValidatorCache();
    }

    async validateDeck(deck) {
        let allCards = (deck.provinceCards || []).concat(deck.dynastyCards || []).concat(deck.conflictCards || []).concat(deck.role || []).concat(deck.stronghold || []);
        let cardCountByName = {};
        _.each(allCards, cardQuantity => {
            if (cardQuantity.card) {
                cardCountByName[cardQuantity.card.id] = 0;
                cardCountByName[cardQuantity.card.id] += cardQuantity.count;
            }
        });

        let mode = this.gameMode;
        if (mode === GameModes.Stronghold) {
            mode = 'standard';
        }

        const body = {
            cards: cardCountByName,
            format: mode
        };

        const json = JSON.stringify(body);
        // Use btoa for browser compatibility (Buffer is Node.js only)
        const key = btoa(unescape(encodeURIComponent(json)));
        const cachedValue = this.cache.getCache(key);

        if (cachedValue) {
            return cachedValue;
        }

        try {
            // const res = await axios.post('https://beta-emeralddb.herokuapp.com/api/decklists/validate', body);
            const res = await axios.post('https://www.emeralddb.org/api/decklists/validate', body);
            const resultObj = {
                valid: res.data.valid,
                extendedStatus: res.data.errors
            };
            this.cache.updateCache(key, resultObj);
            // validatorCache.set(hash, resultObj, 600);
            return resultObj;
        } catch (e) {
            return {
                valid: undefined,
                extendedStatus: ['Error Validating']
            };
        }
    }
}

module.exports = async function validateDeck(deck, options) {
    options = Object.assign({ includeExtendedStatus: true }, options);

    let validator = new DeckValidator(options.packs, options.gameMode);
    let result = await validator.validateDeck(deck);

    if (!options.includeExtendedStatus) {
        return _.omit(result, 'extendedStatus');
    }

    return result;
};
