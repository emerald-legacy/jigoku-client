import db from "../db.js";
import GameErrorService from "../services/GameErrorService.js";
import logger from "../log.js";

export function init(server) {
    const gameErrorService = new GameErrorService(db.getDb());

    server.get("/api/admin/game-errors", async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        if(!req.user.permissions || !req.user.permissions.canViewGameErrors) {
            return res.status(403).send({ message: "Forbidden" });
        }

        try {
            const errors = await gameErrorService.listErrors({
                limit: req.query.limit,
                skip: req.query.skip
            });
            res.send({ success: true, errors: errors });
        } catch(err) {
            logger.error(`Error loading game errors: ${err}`);
            res.status(500).send({ success: false, message: "Error loading game errors" });
        }
    });

    server.get("/api/admin/game-errors/:id", async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        if(!req.user.permissions || !req.user.permissions.canViewGameErrors) {
            return res.status(403).send({ message: "Forbidden" });
        }

        try {
            const error = await gameErrorService.getError(req.params.id);
            if(!error) {
                return res.status(404).send({ success: false, message: "Game error not found" });
            }
            res.send({ success: true, error: error });
        } catch(err) {
            logger.error(`Error loading game error: ${err}`);
            res.status(500).send({ success: false, message: "Error loading game error" });
        }
    });

    server.delete("/api/admin/game-errors/:id", async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        if(!req.user.permissions || !req.user.permissions.canViewGameErrors) {
            return res.status(403).send({ message: "Forbidden" });
        }

        try {
            const deleted = await gameErrorService.deleteError(req.params.id);
            if(!deleted) {
                return res.status(404).send({ success: false, message: "Not found" });
            }
            res.send({ success: true });
        } catch(err) {
            logger.error(`Error deleting game error: ${err}`);
            res.status(500).send({ success: false, message: "Error deleting game error" });
        }
    });
}
