import type { Collection, Db } from "mongodb";

import logger from "../log.js";

export interface GamePlayerRecord {
    name: string;
    faction?: string;
    agenda?: string;
    alliance?: string;
    deckId?: string;
}

export interface GameRecord {
    gameId: string;
    gameType?: string;
    gameMode?: string;
    startedAt?: Date | string;
    finishedAt?: Date | string;
    players: GamePlayerRecord[] | Record<string, GamePlayerRecord>;
    winner?: string;
    winReason?: string;
    roundNumber?: number;
    initialFirstPlayer?: string;
}

class GameService {
    games: Collection<GameRecord>;

    constructor(db: Db) {
        this.games = db.collection<GameRecord>("games");
    }

    async create(game: GameRecord) {
        try {
            const result = await this.games.insertOne(game);
            return { ...game, _id: result.insertedId };
        } catch(err) {
            logger.error(`Unable to create game: ${err}`);
            throw new Error("Unable to create game");
        }
    }

    async update(game: GameRecord) {
        const properties = {
            startedAt: game.startedAt,
            players: game.players,
            winner: game.winner,
            gameMode: game.gameMode,
            winReason: game.winReason,
            finishedAt: game.finishedAt,
            roundNumber: game.roundNumber,
            initialFirstPlayer: game.initialFirstPlayer
        };

        try {
            return await this.games.updateOne({ gameId: game.gameId }, { $set: properties });
        } catch(err) {
            logger.error(`Unable to update game: ${err}`);
            throw new Error("Unable to update game");
        }
    }

    async getAllGames(from: string | Date, to: string | Date) {
        try {
            const games = await this.games.find({
                startedAt: { $gte: from, $lt: to }
            }).toArray();
            return games;
        } catch(err) {
            logger.error(`Unable to get all games from ${from} to ${to}: ${err}`);
            throw new Error("Unable to get all games");
        }
    }
}

export default GameService;
