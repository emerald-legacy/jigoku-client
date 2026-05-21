import type { Collection, Db, Document } from "mongodb";

import logger from "../log.js";
import { toObjectId } from "../db.js";

const allClans = ["crab", "crane", "dragon", "lion", "phoenix", "scorpion", "unicorn"];

interface ReasonCounts {
    conquest: number;
    dishonor: number;
    honor: number;
    concede: number;
    other: number;
}

interface ClanWinLoss {
    wins: number;
    losses: number;
}

export interface DeckStats {
    totalWins: number;
    totalLosses: number;
    byOpponentClan: Record<string, ClanWinLoss>;
    byWinReason: ReasonCounts;
    byLossReason: ReasonCounts;
}

export interface DeckStatsDocument extends Document {
    deckId: unknown;
    username: string;
    contentHash: string;
    stats: DeckStats;
}

function emptyStats(): DeckStats {
    const byOpponentClan: Record<string, ClanWinLoss> = {};
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
    collection: Collection<DeckStatsDocument>;

    constructor(db: Db) {
        this.collection = db.collection<DeckStatsDocument>("deckstats");
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

    async getByDeckId(deckId: string) {
        try {
            return await this.collection.findOne({ deckId: toObjectId(deckId) });
        } catch(err) {
            logger.error(`Unable to fetch deck stats for ${deckId}: ${err}`);
            return null;
        }
    }

    async getByUsername(username: string) {
        try {
            return await this.collection.find({ username }).toArray();
        } catch(err) {
            logger.error(`Unable to fetch deck stats for user ${username}: ${err}`);
            return [];
        }
    }

    async upsertForDeck(deckId: string, username: string, contentHash: string) {
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

    async recordGameResult(deckId: string, { won, opponentClan, winReason, username }: { won: boolean; opponentClan: string | null; winReason: string; username: string }) {
        try {
            const objectId = toObjectId(deckId);
            const inc: Record<string, number> = {};

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
            const setOnInsert: Record<string, unknown> = {
                deckId: objectId,
                username: username || "unknown",
                contentHash: ""
            };

            // Flatten emptyStats into dot-notation and exclude keys that $inc will set
            const incKeys = new Set(Object.keys(inc));
            const flattenStats = (obj: Record<string, unknown>, prefix: string) => {
                for(const [key, val] of Object.entries(obj)) {
                    const path = prefix ? `${prefix}.${key}` : key;
                    if(typeof val === "object" && val !== null && !Array.isArray(val)) {
                        flattenStats(val as Record<string, unknown>, path);
                    } else if(!incKeys.has(path)) {
                        setOnInsert[path] = val;
                    }
                }
            };
            flattenStats(baseStats as unknown as Record<string, unknown>, "stats");

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

    async deleteByDeckId(deckId: string) {
        try {
            await this.collection.deleteOne({ deckId: toObjectId(deckId) });
        } catch(err) {
            logger.error(`Unable to delete deck stats for ${deckId}: ${err}`);
        }
    }

    async deleteByDeckIds(deckIds: string[]) {
        try {
            const objectIds = deckIds.map(id => toObjectId(id));
            await this.collection.deleteMany({ deckId: { $in: objectIds } });
        } catch(err) {
            logger.error(`Unable to delete deck stats: ${err}`);
        }
    }
}

export default DeckStatsService;
