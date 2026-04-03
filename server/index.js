const Server = require('./server.js');
const Lobby = require('./lobby.js');
const db = require('./db.js');
const config = require('config');

async function runServer() {
    // Connect to database first
    const database = await db.connect(config.dbPath);

    const server = new Server(process.env.NODE_ENV !== 'production');
    await server.initDb();

    let lobby;
    server.app.get('/api/server-version', (req, res) => {
        if(!lobby) {
            return res.status(503).json({ nodes: [] });
        }
        res.json({ nodes: lobby.getStatus() });
    });

    const httpServer = await server.init();
    lobby = new Lobby(httpServer, { config: config, db: database });

    server.run();
}

module.exports = runServer;
