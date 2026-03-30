const logger = require('../log.js');

const allClans = ['crab', 'crane', 'dragon', 'lion', 'phoenix', 'scorpion', 'unicorn'];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function normalizeClan(faction) {
    if(!faction) {
        return null;
    }
    return faction.toLowerCase().replace(/\s*clan\s*/i, '').trim();
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

            const clanData = {};
            for(const clan of allClans) {
                clanData[clan] = { gamesPlayed: 0, wins: 0 };
            }

            let totalGames = 0;

            for(const game of games) {
                const players = Array.isArray(game.players)
                    ? game.players
                    : Object.values(game.players || {});

                if(players.length !== 2) {
                    continue;
                }

                totalGames++;

                for(const player of players) {
                    const clan = normalizeClan(player.faction);
                    if(!clan || !clanData[clan]) {
                        continue;
                    }

                    clanData[clan].gamesPlayed++;
                    if(game.winner && player.name === game.winner) {
                        clanData[clan].wins++;
                    }
                }
            }

            const clanStats = allClans.map(clan => ({
                clan,
                gamesPlayed: clanData[clan].gamesPlayed,
                wins: clanData[clan].wins
            }));

            // Collect all clans tied for most wins
            let mostWins = 0;
            for(const entry of clanStats) {
                if(entry.wins > mostWins) {
                    mostWins = entry.wins;
                }
            }

            const mostSuccessfulClans = mostWins > 0
                ? clanStats.filter(entry => entry.wins === mostWins).map(entry => ({ clan: entry.clan, wins: entry.wins }))
                : [];

            const stats = { totalGames, clanStats, mostSuccessfulClans };
            this.cache = stats;
            this.cacheTime = Date.now();

            return stats;
        } catch(err) {
            logger.error(`Unable to get weekly game stats: ${err}`);
            return { totalGames: 0, clanStats: [], mostSuccessfulClans: [] };
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
