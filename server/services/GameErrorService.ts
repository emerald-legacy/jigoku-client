import type { Collection, Db, ObjectId } from "mongodb";

import { toObjectId } from "../db.js";
import logger from "../log.js";

export interface GameErrorRecord {
    _id?: ObjectId;
    gameId: string | null;
    gameName?: string;
    players: string[];
    errorMessage: string;
    errorStack?: string;
    timestamp: Date;
    debugData: unknown;
    count?: number;
    kind?: string;
}

interface ListOptions {
    limit?: number | string;
    skip?: number | string;
}

class GameErrorService {
    errors: Collection<GameErrorRecord>;

    constructor(db: Db) {
        this.errors = db.collection<GameErrorRecord>("gameErrors");
        this.errors.createIndex({ timestamp: 1 }, { expireAfterSeconds: 604800 }).catch((err) => logger.error(`Error creating gameErrors TTL index: ${err}`));
    }

    async addError(record: GameErrorRecord) {
        const result = await this.errors.insertOne(record);
        return { ...record, _id: result.insertedId };
    }

    async addClientError(record: GameErrorRecord) {
        const stackKey = (record.errorStack ?? "").slice(0, 200);
        const sixtySecondsAgo = new Date(record.timestamp.getTime() - 60000);
        const existing = await this.errors.findOneAndUpdate(
            {
                kind: record.kind,
                "players.0": record.players[0],
                errorMessage: record.errorMessage,
                "debugData.stackKey": stackKey,
                timestamp: { $gte: sixtySecondsAgo }
            },
            { $inc: { count: 1 }, $set: { timestamp: record.timestamp } },
            { returnDocument: "after" }
        );
        if(existing) {
            return existing;
        }

        const toInsert: GameErrorRecord = {
            ...record,
            count: 1,
            debugData: { ...(record.debugData as Record<string, unknown>), stackKey }
        };
        const result = await this.errors.insertOne(toInsert);
        return { ...toInsert, _id: result.insertedId };
    }

    async listErrors(options: ListOptions = {}) {
        const limit = Math.min(Math.max(parseInt(String(options.limit ?? 50)) || 50, 1), 200);
        const skip = Math.max(parseInt(String(options.skip ?? 0)) || 0, 0);

        return this.errors
            .find({}, { projection: { debugData: 0 } })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    async getError(id: string) {
        const objectId = toObjectId(id);
        if(typeof objectId === "string") {
            return null;
        }
        return this.errors.findOne({ _id: objectId });
    }

    async deleteError(id: string) {
        const objectId = toObjectId(id);
        if(typeof objectId === "string") {
            return false;
        }
        const result = await this.errors.deleteOne({ _id: objectId });
        return result.deletedCount > 0;
    }
}

export default GameErrorService;
