import type { Collection, Db } from "mongodb";

import logger from "../log.js";
import type { GameRecord, GamePlayerRecord } from "./GameService.js";

const allClans = ["crab", "crane", "dragon", "lion", "phoenix", "scorpion", "unicorn"];
const statModes = ["all", "stronghold", "emerald", "sanctuary"];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface ClanCounts {
    gamesPlayed: number;
    wins: number;
}

interface MatchupCounts {
    played: number;
    wins: number;
}

interface StatsBucket {
    totalGames: number;
    clanData: Record<string, ClanCounts>;
    matchupData: Record<string, Record<string, MatchupCounts>>;
}

interface ClanStatEntry {
    clan: string;
    gamesPlayed: number;
    wins: number;
    matchups: Record<string, { played: number; wins: number; winRate: number }>;
}

interface ComputedStats {
    totalGames: number;
    clanStats: ClanStatEntry[];
    mostSuccessfulClans: { clan: string; winRate: number }[];
}

function normalizeClan(faction: string | undefined | null) {
    if(!faction) {
        return null;
    }
    return faction.toLowerCase().replace(/\s*clan\s*/i, "").trim();
}

function emptyBucket(): StatsBucket {
    const clanData: Record<string, ClanCounts> = {};
    const matchupData: Record<string, Record<string, MatchupCounts>> = {};
    for(const clan of allClans) {
        clanData[clan] = { gamesPlayed: 0, wins: 0 };
        matchupData[clan] = {};
        for(const opp of allClans) {
            if(opp !== clan) {
                matchupData[clan][opp] = { played: 0, wins: 0 };
            }
        }
    }
    return { totalGames: 0, clanData, matchupData };
}

function computeStats(bucket: StatsBucket): ComputedStats {
    const clanStats: ClanStatEntry[] = allClans.map(clan => {
        const matchups: Record<string, { played: number; wins: number; winRate: number }> = {};
        for(const opp of allClans) {
            if(opp !== clan && bucket.matchupData[clan][opp].played > 0) {
                const m = bucket.matchupData[clan][opp];
                matchups[opp] = {
                    played: m.played,
                    wins: m.wins,
                    winRate: Math.round((m.wins / m.played) * 100)
                };
            }
        }

        return {
            clan,
            gamesPlayed: bucket.clanData[clan].gamesPlayed,
            wins: bucket.clanData[clan].wins,
            matchups
        };
    });

    const withRate = clanStats
        .filter(entry => entry.gamesPlayed > 0)
        .map(entry => ({ clan: entry.clan, winRate: Math.round((entry.wins / entry.gamesPlayed) * 100) }));

    let bestRate = 0;
    for(const entry of withRate) {
        if(entry.winRate > bestRate) {
            bestRate = entry.winRate;
        }
    }

    const mostSuccessfulClans = bestRate > 0
        ? withRate.filter(entry => entry.winRate === bestRate)
        : [];

    return { totalGames: bucket.totalGames, clanStats, mostSuccessfulClans };
}

function recordGame(bucket: StatsBucket, game: GameRecord, players: GamePlayerRecord[]) {
    const clan0 = normalizeClan(players[0].faction);
    const clan1 = normalizeClan(players[1].faction);

    for(const player of players) {
        const clan = normalizeClan(player.faction);
        if(!clan || !bucket.clanData[clan]) {
            continue;
        }

        bucket.clanData[clan].gamesPlayed++;

        const opponent = player === players[0] ? clan1 : clan0;
        if(opponent && bucket.matchupData[clan][opponent]) {
            bucket.matchupData[clan][opponent].played++;
        }

        if(game.winner && player.name === game.winner) {
            bucket.clanData[clan].wins++;
            if(opponent && bucket.matchupData[clan][opponent]) {
                bucket.matchupData[clan][opponent].wins++;
            }
        }
    }
}

type StatsResult = Record<string, ComputedStats>;

class GameStatsService {
    games: Collection<GameRecord>;
    cache: StatsResult | null;
    cacheTime: number;
    static getInstance: (db: Db) => GameStatsService;

    constructor(db: Db) {
        this.games = db.collection<GameRecord>("games");
        this.cache = null;
        this.cacheTime = 0;
        this.ensureIndexes();
    }

    invalidateCache() {
        this.cache = null;
        this.cacheTime = 0;
    }

    async ensureIndexes() {
        try {
            await this.games.createIndex({ startedAt: 1 });
        } catch(err) {
            logger.error(`Failed to create games indexes: ${err}`);
        }
    }

    async getMonthlyStats() {
        if(this.cache && Date.now() - this.cacheTime < CACHE_TTL) {
            return this.cache;
        }

        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

            // startedAt may be stored as Date or ISO string depending on game age
            const games = await this.games.find({
                $or: [
                    { startedAt: { $gte: thirtyDaysAgo } },
                    { startedAt: { $gte: thirtyDaysAgoStr } }
                ]
            }, {
                projection: { players: 1, winner: 1, gameMode: 1, startedAt: 1 }
            }).toArray();

            const buckets: Record<string, StatsBucket> = {};
            for(const mode of statModes) {
                buckets[mode] = emptyBucket();
            }

            for(const game of games) {
                const players: GamePlayerRecord[] = Array.isArray(game.players)
                    ? game.players
                    : Object.values(game.players || {});

                if(players.length !== 2) {
                    continue;
                }

                const mode = game.gameMode;
                if(mode && buckets[mode]) {
                    buckets[mode].totalGames++;
                    buckets.all.totalGames++;
                    if(game.winner) {
                        recordGame(buckets[mode], game, players);
                        recordGame(buckets.all, game, players);
                    }
                }
            }

            const stats: StatsResult = {};
            for(const mode of statModes) {
                stats[mode] = computeStats(buckets[mode]);
            }

            this.cache = stats;
            this.cacheTime = Date.now();

            return stats;
        } catch(err) {
            logger.error(`Unable to get monthly game stats: ${err}`);
            const empty: ComputedStats = { totalGames: 0, clanStats: [], mostSuccessfulClans: [] };
            return { all: empty, stronghold: empty, emerald: empty, sanctuary: empty };
        }
    }
}

let instance: GameStatsService | null = null;

GameStatsService.getInstance = function(db: Db) {
    if(!instance) {
        instance = new GameStatsService(db);
    }
    return instance;
};

export default GameStatsService;
