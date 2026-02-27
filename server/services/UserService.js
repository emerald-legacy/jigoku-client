const escapeRegex = require('../util.js').escapeRegex;
const logger = require('../log.js');
const { toObjectId } = require('../db.js');

class UserService {
    constructor(db) {
        this.users = db.collection('users');
    }

    async getUserByUsername(username) {
        try {
            return await this.users.findOne({
                username: { $regex: new RegExp('^' + escapeRegex(username.toLowerCase()) + '$', 'i') }
            });
        } catch(err) {
            logger.error(`Error fetching user by username: ${err}`);
            throw new Error('Error occurred fetching users');
        }
    }

    async getUserByEmail(email) {
        try {
            return await this.users.findOne({
                email: { $regex: new RegExp('^' + escapeRegex(email.toLowerCase()) + '$', 'i') }
            });
        } catch(err) {
            logger.error(`Error fetching user by email: ${err}`);
            throw new Error('Error occurred fetching users');
        }
    }

    async getUserById(id) {
        try {
            return await this.users.findOne({ _id: toObjectId(id) });
        } catch(err) {
            logger.error(`Error fetching user by id: ${err}`);
            throw new Error('Error occurred fetching users');
        }
    }

    async addUser(user) {
        try {
            await this.users.insertOne(user);
            return user;
        } catch(err) {
            logger.error(`Error adding user ${user.username}: ${err}`);
            throw new Error('Error occurred adding user');
        }
    }

    async update(user) {
        const toSet = {
            email: user.email,
            settings: user.settings,
            promptedActionWindows: user.promptedActionWindows,
            permissions: user.permissions
        };

        if(user.password && user.password !== '') {
            toSet.password = user.password;
        }

        try {
            return await this.users.updateOne({ username: user.username }, { $set: toSet });
        } catch(err) {
            logger.error(`Error updating user: ${err}`);
            throw new Error('Error setting user details');
        }
    }

    async updateBlockList(user) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $set: { blockList: user.blockList } }
            );
        } catch(err) {
            logger.error(`Error updating block list: ${err}`);
            throw new Error('Error setting user details');
        }
    }

    async setResetToken(user, token, tokenExpiration) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $set: { resetToken: token, tokenExpires: tokenExpiration } }
            );
        } catch(err) {
            logger.error(`Error setting reset token: ${err}`);
            throw new Error('Error setting reset token');
        }
    }

    async setPassword(user, password) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $set: { password: password } }
            );
        } catch(err) {
            logger.error(`Error setting password: ${err}`);
            throw new Error('Error setting password');
        }
    }

    async clearResetToken(user) {
        try {
            return await this.users.updateOne(
                { username: user.username },
                { $unset: { resetToken: '', tokenExpires: '' } }
            );
        } catch(err) {
            logger.error(`Error clearing reset token: ${err}`);
            throw new Error('Error clearing reset token');
        }
    }
}

module.exports = UserService;
