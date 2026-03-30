const logger = require('../log.js');

const allClans = ['crab', 'crane', 'dragon', 'lion', 'phoenix', 'scorpion', 'unicorn'];
const statModes = ['all', 'stronghold', 'emerald', 'sanctuary'];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function normalizeClan(faction) {
    if(!faction) {
        return null;
    }
    return faction.toLowerCase().replace(/\s*clan\s*/i, '').trim();
}

function emptyBucket() {
    const clanData = {};
    const matchupData = {};
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

function computeStats(bucket) {
    const clanStats = allClans.map(clan => {
        const matchups = {};
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

function recordGame(bucket, game, players) {
    bucket.totalGames++;

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

class GameStatsService {
    constructor(db) {
        this.games = db.collection('games');
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
            }).toArray();

            const buckets = {};
            for(const mode of statModes) {
                buckets[mode] = emptyBucket();
            }

            for(const game of games) {
                const players = Array.isArray(game.players)
                    ? game.players
                    : Object.values(game.players || {});

                if(players.length !== 2) {
                    continue;
                }

                const mode = game.gameMode;
                if(mode && buckets[mode]) {
                    recordGame(buckets[mode], game, players);
                    recordGame(buckets.all, game, players);
                }
            }

            const stats = {};
            for(const mode of statModes) {
                stats[mode] = computeStats(buckets[mode]);
            }

            this.cache = stats;
            this.cacheTime = Date.now();

            return stats;
        } catch(err) {
            logger.error(`Unable to get monthly game stats: ${err}`);
            const empty = { totalGames: 0, clanStats: [], mostSuccessfulClans: [] };
            return { all: empty, stronghold: empty, emerald: empty, sanctuary: empty };
        }
    }
}

let instance = null;

GameStatsService.getInstance = function(db) {
    if(!instance) {
        instance = new GameStatsService(db);
    }
    return instance;
};

module.exports = GameStatsService;
