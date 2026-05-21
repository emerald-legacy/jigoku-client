import type { Collection, Db, Filter } from "mongodb";
import type { Deck } from "../../client/types/deck.js";

import logger from "../log.js";
import { toObjectId } from "../db.js";

export interface DeckRecord extends Deck {
    username?: string;
    deckName?: string;
    id?: string;
}

class DeckService {
    decks: Collection<DeckRecord>;

    constructor(db: Db) {
        this.decks = db.collection<DeckRecord>("decks");
    }

    async getById(id: string) {
        try {
            return await this.decks.findOne({ _id: toObjectId(id) });
        } catch(err) {
            logger.error(`Unable to fetch deck ${id}: ${err}`);
            throw new Error("Unable to fetch deck " + id);
        }
    }

    async findByUserName(userName: string, options: { format?: string } = {}) {
        const query: Filter<DeckRecord> = { username: userName };

        if(options.format) {
            (query as Record<string, unknown>)["format.value"] = options.format;
        }

        return this.decks.find(query).sort({ lastUpdated: -1 }).toArray();
    }

    async countByUserName(userName: string) {
        return this.decks.countDocuments({ username: userName });
    }

    async create(deck: DeckRecord) {
        const properties: Partial<DeckRecord> = {
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
            lastUpdated: new Date().toISOString()
        };

        const result = await this.decks.insertOne(properties as DeckRecord);
        return { ...properties, _id: result.insertedId };
    }

    async update(deck: DeckRecord) {
        const properties: Partial<DeckRecord> = {
            name: deck.deckName,
            provinceCards: deck.provinceCards,
            stronghold: deck.stronghold,
            role: deck.role,
            conflictCards: deck.conflictCards,
            dynastyCards: deck.dynastyCards,
            faction: deck.faction,
            alliance: deck.alliance,
            format: deck.format,
            lastUpdated: new Date().toISOString()
        };

        return this.decks.updateOne({ _id: toObjectId(deck.id) }, { $set: properties });
    }

    async delete(id: string) {
        return this.decks.deleteOne({ _id: toObjectId(id) });
    }

    async findByIds(ids: string[]) {
        const objectIds = ids.map(id => toObjectId(id));
        return this.decks.find({ _id: { $in: objectIds } }).toArray();
    }

    async deleteMany(ids: string[]) {
        const objectIds = ids.map(id => toObjectId(id));
        return this.decks.deleteMany({ _id: { $in: objectIds } });
    }
}

export default DeckService;
