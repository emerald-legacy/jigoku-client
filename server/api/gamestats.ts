import db from "../db.js";
import GameStatsService from "../services/GameStatsService.js";
import { wrapAsync } from "../util.js";

export function init(server) {
    const gameStatsService = GameStatsService.getInstance(db.getDb());

    server.get("/api/gamestats", wrapAsync(async function(req, res) {
        const stats = await gameStatsService.getMonthlyStats();
        res.send({ success: true, stats });
    }));
}
