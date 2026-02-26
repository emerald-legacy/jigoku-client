const Server = require('./server.js');
const Lobby = require('./lobby.js');
const pmx = require('pmx');
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

    const httpServer = server.init();
    lobby = new Lobby(httpServer, { config: config, db: database });

    pmx.action('status', reply => {
        const status = lobby.getStatus();
        reply(status);
    });

    pmx.action('disable', (param, reply) => {
        if(!param) {
            reply({ error: 'Need to specify node to disable' });
            return;
        }
        reply({ success: lobby.disableNode(param) });
    });

    pmx.action('enable', (param, reply) => {
        if(!param) {
            reply({ error: 'Need to specify node to enable' });
            return;
        }
        reply({ success: lobby.enableNode(param) });
    });

    pmx.action('debug', reply => {
        reply(lobby.debugDump());
    });

    server.run();
}

module.exports = runServer;
