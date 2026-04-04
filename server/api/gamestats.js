const db = require("../db.js");
const GameStatsService = require("../services/GameStatsService.js");
const { wrapAsync } = require("../util.js");

module.exports.init = function(server) {
    const gameStatsService = GameStatsService.getInstance(db.getDb());

    server.get("/api/gamestats", wrapAsync(async function(req, res) {
        const stats = await gameStatsService.getMonthlyStats();
        res.send({ success: true, stats });
    }));
};
