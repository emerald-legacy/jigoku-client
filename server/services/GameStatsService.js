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

            let totalGames = 0;

            for(const game of games) {
                const players = Array.isArray(game.players)
                    ? game.players
                    : Object.values(game.players || {});

                if(players.length !== 2) {
                    continue;
                }

                totalGames++;

                const clan0 = normalizeClan(players[0].faction);
                const clan1 = normalizeClan(players[1].faction);

                for(const player of players) {
                    const clan = normalizeClan(player.faction);
                    if(!clan || !clanData[clan]) {
                        continue;
                    }

                    clanData[clan].gamesPlayed++;

                    const opponent = player === players[0] ? clan1 : clan0;
                    if(opponent && matchupData[clan][opponent]) {
                        matchupData[clan][opponent].played++;
                    }

                    if(game.winner && player.name === game.winner) {
                        clanData[clan].wins++;
                        if(opponent && matchupData[clan][opponent]) {
                            matchupData[clan][opponent].wins++;
                        }
                    }
                }
            }

            const clanStats = allClans.map(clan => {
                const matchups = {};
                for(const opp of allClans) {
                    if(opp !== clan && matchupData[clan][opp].played > 0) {
                        const m = matchupData[clan][opp];
                        matchups[opp] = {
                            played: m.played,
                            wins: m.wins,
                            winRate: Math.round((m.wins / m.played) * 100)
                        };
                    }
                }

                return {
                    clan,
                    gamesPlayed: clanData[clan].gamesPlayed,
                    wins: clanData[clan].wins,
                    matchups
                };
            });

            // Rank by win percentage; require at least 1 game played
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
