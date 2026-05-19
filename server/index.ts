import config from "config";

import Server from "./server.js";
import Lobby from "./lobby.js";
import db from "./db.js";

async function runServer() {
    // Connect to database first
    const database = await db.connect(config.get("dbPath"));

    const server = new Server(process.env.NODE_ENV !== "production");
    await server.initDb();

    let lobby;
    server.app.get("/api/server-version", (req, res) => {
        if(!lobby) {
            return res.status(503).json({ nodes: [] });
        }
        res.json({ nodes: lobby.getStatus() });
    });

    const httpServer = await server.init();
    lobby = new Lobby(httpServer, { config: config, db: database });

    server.run();
}

export default runServer;
