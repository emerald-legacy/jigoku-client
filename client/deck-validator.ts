/// <reference lib="dom" />
import axios from "axios";
import GameModes from "../shared/GameModes.js";
import type { Deck, DeckCard, Pack } from "./types/deck.js";

interface CachedValue {
    expiryTime?: number;
    valid?: boolean | undefined;
    extendedStatus?: string[];
}

interface ValidateOptions {
    packs?: Pack[];
    gameMode?: string;
    includeExtendedStatus?: boolean;
}

interface ValidateResult {
    valid: boolean | undefined;
    extendedStatus?: string[];
}

class ValidatorCache {
    updateCache(key: string, value: CachedValue) {
        if(typeof window === "undefined") {
            return;
        }

        const expiryTime = Date.now() + (1000 * 60 * 60 * 1); // 1 hour

        value.expiryTime = expiryTime;
        const json = JSON.stringify(value);

        localStorage.setItem(key, json);
    }

    getCache(key: string): CachedValue | null {
        if(typeof window === "undefined") {
            return null;
        }

        const cachedValue = localStorage.getItem(key);
        if(!cachedValue) {
            return null;
        }

        const parsed = JSON.parse(cachedValue);
        if(!parsed.expiryTime) {
            localStorage.removeItem(key);
            return null;
        }
        if(parsed.expiryTime < Date.now()) {
            localStorage.removeItem(key);
            return null;
        }

        return parsed;
    }
}

class DeckValidator {
    packs: Pack[] | undefined;
    gameMode: string;
    cache: ValidatorCache;

    constructor(packs: Pack[] | undefined, gameMode: string) {
        this.packs = packs;
        this.gameMode = gameMode;
        this.cache = new ValidatorCache();
    }

    async validateDeck(deck: Deck): Promise<ValidateResult> {
        let allCards: DeckCard[] = (deck.provinceCards || []).concat(deck.dynastyCards || []).concat(deck.conflictCards || []).concat(deck.role || []).concat(deck.stronghold || []);
        let cardCountByName: Record<string, number> = {};
        allCards.forEach((cardQuantity: DeckCard) => {
            if(cardQuantity.card) {
                cardCountByName[cardQuantity.card.id] = 0;
                cardCountByName[cardQuantity.card.id] += cardQuantity.count;
            }
        });

        let mode = this.gameMode;
        if(mode === GameModes.Stronghold) {
            mode = "standard";
        }

        const body = {
            cards: cardCountByName,
            format: mode
        };

        const json = JSON.stringify(body);
        // Use btoa for browser compatibility (Buffer is Node.js only)
        const key = btoa(unescape(encodeURIComponent(json)));
        const cachedValue = this.cache.getCache(key);

        if(cachedValue) {
            return cachedValue as ValidateResult;
        }

        try {
            const res = await axios.post("https://www.emeralddb.org/api/decklists/validate", body);
            const resultObj = {
                valid: res.data.valid,
                extendedStatus: res.data.errors
            };
            this.cache.updateCache(key, resultObj);
            return resultObj;
        } catch(_e) {
            return {
                valid: undefined,
                extendedStatus: ["Error Validating"]
            };
        }
    }
}

export default async function validateDeck(deck: Deck, options?: ValidateOptions) {
    options = Object.assign({ includeExtendedStatus: true }, options);

    let validator = new DeckValidator(options.packs, options.gameMode || "");
    let result = await validator.validateDeck(deck);

    if(!options.includeExtendedStatus) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { extendedStatus, ...resultWithoutExtendedStatus } = result;
        return resultWithoutExtendedStatus;
    }

    return result;
}
