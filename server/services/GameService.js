const logger = require('../log.js');

class GameService {
    constructor(db) {
        this.games = db.get('games');
    }

    create(game) {
        return this.games.insert(game)
            .catch(err => {
                logger.error('Unable to create game', err);
                throw new Error('Unable to create game');
            });
    }

    update(game) {
        let properties = {
            startedAt: game.startedAt,
            players: game.players,
            winner: game.winner,
            gameMode: game.gameMode,
            winReason: game.winReason,
            finishedAt: game.finishedAt,
            roundNumber: game.roundNumber,
            initialFirstPlayer: game.initialFirstPlayer
        };
        return this.games.update({ gameId: game.gameId }, { '$set': properties })
            .catch(err => {
                logger.error('Unable to update game', err);
                throw new Error('Unable to update game');
            });
    }

    getAllGames(from, to) {
        return this.games.find()
            .then(games => {
                return games.filter(game => game.startedAt >= from && game.startedAt < to);
            })
            .catch(err => {
                logger.error('Unable to get all games from', from, 'to', to, err);
                throw new Error('Unable to get all games');
            });
    }
}

module.exports = GameService;

