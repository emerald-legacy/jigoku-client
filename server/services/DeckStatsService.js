const logger = require("../log.js");
const { toObjectId } = require("../db.js");

const allClans = ["crab", "crane", "dragon", "lion", "phoenix", "scorpion", "unicorn"];

function emptyStats() {
    const byOpponentClan = {};
    for(const clan of allClans) {
        byOpponentClan[clan] = { wins: 0, losses: 0 };
    }

    return {
        totalWins: 0,
        totalLosses: 0,
        byOpponentClan,
        byWinReason: { conquest: 0, dishonor: 0, honor: 0, concede: 0, other: 0 },
        byLossReason: { conquest: 0, dishonor: 0, honor: 0, concede: 0, other: 0 }
    };
}

class DeckStatsService {
    constructor(db) {
        this.collection = db.collection("deckstats");
        this.ensureIndexes();
    }

    async ensureIndexes() {
        try {
            await this.collection.createIndex({ deckId: 1 }, { unique: true });
            await this.collection.createIndex({ username: 1 });
        } catch(err) {
            logger.error(`Failed to create deckstats indexes: ${err}`);
        }
    }

    async getByDeckId(deckId) {
        try {
            return await this.collection.findOne({ deckId: toObjectId(deckId) });
        } catch(err) {
            logger.error(`Unable to fetch deck stats for ${deckId}: ${err}`);
            return null;
        }
    }

    async getByUsername(username) {
        try {
            return await this.collection.find({ username }).toArray();
        } catch(err) {
            logger.error(`Unable to fetch deck stats for user ${username}: ${err}`);
            return [];
        }
    }

    async upsertForDeck(deckId, username, contentHash) {
        try {
            const objectId = toObjectId(deckId);
            const existing = await this.collection.findOne({ deckId: objectId });

            if(existing && existing.contentHash === contentHash) {
                return existing;
            }

            // Hash changed or new deck — reset stats
            const doc = {
                deckId: objectId,
                username,
                contentHash,
                stats: emptyStats()
            };

            await this.collection.updateOne(
                { deckId: objectId },
                { $set: doc },
                { upsert: true }
            );

            return doc;
        } catch(err) {
            logger.error(`Unable to upsert deck stats for ${deckId}: ${err}`);
        }
    }

    async recordGameResult(deckId, { won, opponentClan, winReason, username }) {
        try {
            const objectId = toObjectId(deckId);
            const inc = {};

            if(won) {
                inc["stats.totalWins"] = 1;
                if(opponentClan && allClans.includes(opponentClan)) {
                    inc[`stats.byOpponentClan.${opponentClan}.wins`] = 1;
                }
                const reasonKey = ["conquest", "dishonor", "honor", "concede"].includes(winReason) ? winReason : "other";
                inc[`stats.byWinReason.${reasonKey}`] = 1;
            } else {
                inc["stats.totalLosses"] = 1;
                if(opponentClan && allClans.includes(opponentClan)) {
                    inc[`stats.byOpponentClan.${opponentClan}.losses`] = 1;
                }
                const reasonKey = ["conquest", "dishonor", "honor", "concede"].includes(winReason) ? winReason : "other";
                inc[`stats.byLossReason.${reasonKey}`] = 1;
            }

            // Build $setOnInsert with full stats structure for new docs.
            // Fields in $inc are excluded from $setOnInsert to avoid conflicts.
            const baseStats = emptyStats();
            const setOnInsert = {
                deckId: objectId,
                username: username || "unknown",
                contentHash: ""
            };

            // Flatten emptyStats into dot-notation and exclude keys that $inc will set
            const incKeys = new Set(Object.keys(inc));
            const flattenStats = (obj, prefix) => {
                for(const [key, val] of Object.entries(obj)) {
                    const path = prefix ? `${prefix}.${key}` : key;
                    if(typeof val === "object" && val !== null && !Array.isArray(val)) {
                        flattenStats(val, path);
                    } else if(!incKeys.has(path)) {
                        setOnInsert[path] = val;
                    }
                }
            };
            flattenStats(baseStats, "stats");

            await this.collection.updateOne(
                { deckId: objectId },
                {
                    $inc: inc,
                    $setOnInsert: setOnInsert
                },
                { upsert: true }
            );
        } catch(err) {
            logger.error(`Unable to record game result for deck ${deckId}: ${err}`);
        }
    }

    async deleteByDeckId(deckId) {
        try {
            await this.collection.deleteOne({ deckId: toObjectId(deckId) });
        } catch(err) {
            logger.error(`Unable to delete deck stats for ${deckId}: ${err}`);
        }
    }

    async deleteByDeckIds(deckIds) {
        try {
            const objectIds = deckIds.map(id => toObjectId(id));
            await this.collection.deleteMany({ deckId: { $in: objectIds } });
        } catch(err) {
            logger.error(`Unable to delete deck stats: ${err}`);
        }
    }
}

module.exports = DeckStatsService;
