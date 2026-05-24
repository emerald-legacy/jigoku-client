import db from "../db.js";
import GameErrorService from "../services/GameErrorService.js";
import logger from "../log.js";

const CLIENT_ERROR_KINDS = new Set(["react", "window", "unhandledRejection"]);
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MESSAGE_MAX = 1000;
const STACK_MAX = 4000;

function truncate(value: unknown, max: number): string | undefined {
    if(typeof value !== "string") {
        return undefined;
    }
    return value.length > max ? value.slice(0, max) : value;
}

export function init(server) {
    const gameErrorService = new GameErrorService(db.getDb());
    const rateLimits = new Map<string, { count: number; windowStart: number }>();

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

    server.post("/api/admin/game-errors/client", async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ success: false, message: "Unauthorized" });
        }

        const username = req.user.username;
        const now = Date.now();
        const bucket = rateLimits.get(username);
        if(!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
            rateLimits.set(username, { count: 1, windowStart: now });
        } else {
            if(bucket.count >= RATE_LIMIT_MAX) {
                return res.status(429).send({ success: false, message: "Too many error reports" });
            }
            bucket.count += 1;
        }

        const body = req.body ?? {};
        const errorMessage = truncate(body.errorMessage, MESSAGE_MAX);
        if(!errorMessage) {
            return res.status(400).send({ success: false, message: "errorMessage required" });
        }
        const kind = body.kind;
        if(typeof kind !== "string" || !CLIENT_ERROR_KINDS.has(kind)) {
            return res.status(400).send({ success: false, message: "Invalid kind" });
        }

        const errorStack = truncate(body.errorStack, STACK_MAX);
        const componentStack = truncate(body.componentStack, STACK_MAX);
        const url = truncate(body.url, MESSAGE_MAX);
        const userAgent = truncate(body.userAgent, MESSAGE_MAX);

        try {
            await gameErrorService.addClientError({
                gameId: null,
                players: [username],
                errorMessage,
                errorStack,
                timestamp: new Date(),
                kind,
                debugData: { componentStack, kind, url, userAgent }
            });
            res.send({ success: true });
        } catch(err) {
            logger.error(`Error recording client error: ${err}`);
            res.status(500).send({ success: false, message: "Error recording client error" });
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
