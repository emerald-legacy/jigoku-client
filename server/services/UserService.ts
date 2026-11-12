import type { Collection, Db, ObjectId } from "mongodb";

import logger from "../log.js";
import { toObjectId } from "../db.js";

export interface UserRecord {
    _id?: ObjectId;
    username: string;
    email?: string;
    emailHash?: string;
    password?: string;
    registered?: Date;
    admin?: boolean;
    settings?: Record<string, unknown>;
    promptedActionWindows?: Record<string, boolean>;
    permissions?: Record<string, boolean>;
    blockList?: string[];
    resetToken?: string;
    tokenExpires?: string;
}

// Usernames and emails match regardless of case, and these indexes use the same collation.
const caseInsensitive = { locale: "en", strength: 2 };

class UserService {
    users: Collection<UserRecord>;

    constructor(db: Db) {
        this.users = db.collection<UserRecord>("users");
    }

    async ensureIndexes() {
        try {
            await this.users.createIndex({ username: 1 }, { name: "username_ci", collation: caseInsensitive });
            await this.users.createIndex({ email: 1 }, { name: "email_ci", collation: caseInsensitive });
        } catch(err) {
            logger.error(`Failed to create users indexes: ${err}`);
        }
    }

    async getUserByUsername(username: string) {
        // JSON bodies reach this: an object such as { $regex: ... } would match some other user
        if(typeof username !== "string") {
            return null;
        }
        try {
            return await this.users.findOne({ username }, { collation: caseInsensitive });
        } catch(err) {
            logger.error(`Error fetching user by username: ${err}`);
            throw new Error("Error occurred fetching users", { cause: err });
        }
    }

    async getUserByEmail(email: string) {
        if(typeof email !== "string") {
            return null;
        }
        try {
            return await this.users.findOne({ email }, { collation: caseInsensitive });
        } catch(err) {
            logger.error(`Error fetching user by email: ${err}`);
            throw new Error("Error occurred fetching users", { cause: err });
        }
    }

    async getUserById(id: string) {
        try {
            return await this.users.findOne({ _id: toObjectId(id) });
        } catch(err) {
            logger.error(`Error fetching user by id: ${err}`);
            throw new Error("Error occurred fetching users", { cause: err });
        }
    }

    async addUser(user: UserRecord) {
        try {
            await this.users.insertOne(user);
            return user;
        } catch(err) {
            logger.error(`Error adding user ${user.username}: ${err}`);
            throw new Error("Error occurred adding user", { cause: err });
        }
    }

    async update(user: UserRecord) {
        const toSet: Partial<UserRecord> = {
            email: user.email,
            settings: user.settings,
            promptedActionWindows: user.promptedActionWindows,
            permissions: user.permissions
        };

        if(user.password && user.password !== "") {
            toSet.password = user.password;
        }

        try {
            return await this.users.updateOne({ username: user.username }, { $set: toSet });
        } catch(err) {
            logger.error(`Error updating user: ${err}`);
            throw new Error("Error setting user details", { cause: err });
        }
    }

    async updateBlockList(user: UserRecord) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $set: { blockList: user.blockList } }
            );
        } catch(err) {
            logger.error(`Error updating block list: ${err}`);
            throw new Error("Error setting user details", { cause: err });
        }
    }

    async setResetToken(user: UserRecord, token: string, tokenExpiration: string) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $set: { resetToken: token, tokenExpires: tokenExpiration } }
            );
        } catch(err) {
            logger.error(`Error setting reset token: ${err}`);
            throw new Error("Error setting reset token", { cause: err });
        }
    }

    async setPassword(user: UserRecord, password: string) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $set: { password: password } }
            );
        } catch(err) {
            logger.error(`Error setting password: ${err}`);
            throw new Error("Error setting password", { cause: err });
        }
    }

    async clearResetToken(user: UserRecord) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $unset: { resetToken: "", tokenExpires: "" } }
            );
        } catch(err) {
            logger.error(`Error clearing reset token: ${err}`);
            throw new Error("Error clearing reset token", { cause: err });
        }
    }
}

export default UserService;
