const db = require("../db.js");
const UserService = require("../services/UserService.js");
const logger = require("../log.js");

module.exports.init = function(server) {
    const userService = new UserService(db.getDb());

    server.get("/api/user/:username", async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        if(!req.user.permissions || !req.user.permissions.canManageUsers) {
            return res.status(403).send({ message: "Forbidden" });
        }

        try {
            const user = await userService.getUserByUsername(req.params.username);

            if(!user) {
                return res.status(404).send({ message: "Not found" });
            }

            const { password: _pw, resetToken: _rt, tokenExpires: _te, ...safeUser } = user;
            res.send({ success: true, user: safeUser });
        } catch(err) {
            logger.error(`Error fetching user ${req.params.username}: ${err}`);
            res.status(500).send({ success: false, message: "Error fetching user" });
        }
    });

    server.put("/api/user/:username", async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        if(!req.user.permissions || !req.user.permissions.canManageUsers) {
            return res.status(403).send({ message: "Forbidden" });
        }

        try {
            let userToSet;
            try {
                userToSet = JSON.parse(req.body.data);
            } catch(_e) {
                return res.status(400).send({ success: false, message: "Invalid request data" });
            }

            const user = await userService.getUserByUsername(req.params.username);

            if(!user) {
                return res.status(404).send({ message: "Not found" });
            }

            const allowedPermissions = ["canEditNews", "canManageUsers", "allowMelee"];
            const incomingPerms = userToSet.permissions || {};
            user.permissions = Object.fromEntries(
                allowedPermissions.map(key => [key, !!incomingPerms[key]])
            );
            await userService.update(user);

            res.send({ success: true });
        } catch(err) {
            logger.error(`Error saving user ${req.params.username}: ${err}`);
            res.send({ success: false, message: "An error occurred saving the user" });
        }
    });
};
