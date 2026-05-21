import type { Collection, Db } from "mongodb";
import type { Pack } from "../../client/types/deck.js";

import logger from "../log.js";

export interface CardRecord {
    id: string;
    name?: string;
    type?: string;
    clan?: string;
    faction?: string;
    side?: string;
    deck_limit?: number;
    elements?: string[];
    is_unique?: boolean;
    influence_cost?: number;
    influence_pool?: number;
    versions?: unknown[];
    role_restriction?: string;
    allowed_clans?: string[];
    [key: string]: unknown;
}

class CardService {
    cards: Collection<CardRecord>;
    packs: Collection<Pack>;

    constructor(db: Db) {
        this.cards = db.collection<CardRecord>("cards");
        this.packs = db.collection<Pack>("packs");
    }

    async replaceCards(cards: CardRecord[]) {
        await this.cards.deleteMany({});
        if(cards.length > 0) {
            await this.cards.insertMany(cards);
        }
    }

    async replacePacks(packs: Pack[]) {
        await this.packs.deleteMany({});
        if(packs.length > 0) {
            await this.packs.insertMany(packs);
        }
    }

    async getAllCards(options?: { shortForm?: boolean }): Promise<Record<string, CardRecord> | undefined> {
        try {
            const result = await this.cards.find({}).toArray();
            const cards: Record<string, CardRecord> = {};

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

    async getAllPacks(): Promise<Pack[] | undefined> {
        try {
            return await this.packs.find({}).toArray();
        } catch(err) {
            logger.error(`Error fetching packs: ${err}`);
        }
    }
}

export default CardService;
