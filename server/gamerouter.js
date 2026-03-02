const { Router } = require('zeromq');
const logger = require('./log.js');
const db = require('./db.js');
const EventEmitter = require('events');
const GameService = require('./services/GameService.js');

class GameRouter extends EventEmitter {
    constructor(config) {
        super();

        this.workers = {};
        this.gameService = new GameService(db.getDb());
        this.router = new Router({ handover: true });
        this.running = false;

        this.init(config.mqUrl);
        setInterval(this.checkTimeouts.bind(this), 1000 * 15);
    }

    async init(url) {
        try {
            await this.router.bind(url);
            logger.info(`GameRouter bound to ${url}`);
            this.running = true;
            this.receiveMessages();
        } catch(err) {
            logger.error(`Failed to bind GameRouter: ${err}`);
        }
    }

    async receiveMessages() {
        while(this.running) {
            try {
                const [identity, delimiter, msg] = await this.router.receive();
                this.onMessage(identity, msg);
            } catch(err) {
                if(this.running) {
                    logger.error(`Error receiving message: ${err}`);
                }
            }
        }
    }

    // External methods
    startGame(game) {
        var node = this.getNextAvailableGameNode();

        if(!node) {
            logger.error('Could not find new node for game');
            return;
        }
        logger.info(`starting game on node ${node.identity}`);

        this.gameService.create(game.getSaveState());

        node.numGames++;

        this.sendCommand(node.identity, 'STARTGAME', game);
        return node;
    }

    addSpectator(game, user) {
        this.sendCommand(game.node.identity, 'SPECTATOR', { game: game, user: user });
    }

    getNextAvailableGameNode() {
        const workerList = Object.values(this.workers);
        if(workerList.length === 0) {
            return undefined;
        }

        var returnedWorker = undefined;

        workerList.forEach(worker => {
            if(worker.numGames >= worker.maxGames || worker.disabled) {
                return;
            }

            if(!returnedWorker || returnedWorker.numGames > worker.numGames) {
                returnedWorker = worker;
            }
        });

        return returnedWorker;
    }

    getNodeStatus() {
        return Object.values(this.workers).map(worker => {
            return { name: worker.identity, numGames: worker.numGames, status: worker.disabled ? 'disabled' : 'active', version: worker.version };
        });
    }

    disableNode(nodeName) {
        var worker = this.workers[nodeName];
        if(!worker) {
            return false;
        }

        worker.disabled = true;

        return true;
    }

    enableNode(nodeName) {
        var worker = this.workers[nodeName];
        if(!worker) {
            return false;
        }

        worker.disabled = false;

        return true;
    }

    notifyFailedConnect(game, username) {
        logger.info(`notify failed connect ${game.node.identity}`);
        if(!game.node) {
            return;
        }

        this.sendCommand(game.node.identity, 'CONNECTFAILED', { gameId: game.id, username: username });
    }

    closeGame(game) {
        if(!game.node) {
            return;
        }

        this.sendCommand(game.node.identity, 'CLOSEGAME', { gameId: game.id });
    }

    // Events
    onMessage(identity, msg) {
        var identityStr = identity.toString();

        var worker = this.workers[identityStr];

        var message = undefined;

        try {
            message = JSON.parse(msg.toString());
        } catch(err) {
            logger.error(`Failed to parse ZMQ message from ${identityStr}: ${err}`);
            return;
        }

        switch(message.command) {
            case 'HEARTBEAT':
                logger.debug(`received HEARTBEAT from ${identityStr}`);
                // Game node sends periodic heartbeats. If we don't know this node
                // (e.g. lobby restarted), ask it to re-register.
                if(!worker) {
                    logger.info('Unknown node %s sent heartbeat, requesting registration', identityStr);
                    this.sendCommand(identityStr, 'REGISTER');
                }
                return;
            case 'PONG':
                logger.debug(`received PONG from ${identityStr}`);
                if(worker) {
                    worker.pingSent = undefined;
                } else {
                    logger.error('PONG received for unknown worker');
                }
                break;
            case 'HELLO':
                logger.info(`received HELLO from ${identityStr}`);
                this.emit('onWorkerStarted', identityStr);
                this.workers[identityStr] = {
                    identity: identityStr,
                    maxGames: message.arg.maxGames,
                    numGames: 0,
                    address: message.arg.address,
                    port: message.arg.port,
                    protocol: message.arg.protocol,
                    version: message.arg.version || 'unknown'
                };
                worker = this.workers[identityStr];

                this.emit('onNodeReconnected', identityStr, message.arg.games);

                worker.numGames = Object.keys(message.arg.games).length;

                break;
            case 'GAMEWIN':
                logger.info(`received GAMEWIN from ${identityStr}`);
                this.gameService.update(message.arg.game);
                break;
            case 'GAMECLOSED':
                logger.info(`received GAMECLOSED from ${identityStr}`);
                if(worker) {
                    worker.numGames--;
                } else {
                    logger.error(`Got close game for non existent worker ${identity}`);
                }

                this.emit('onGameClosed', message.arg.game);

                break;
            case 'PLAYERLEFT':
                logger.info(`received PLAYERLEFT from ${identityStr}`);
                if(!message.arg.spectator) {
                    this.gameService.update(message.arg.game);
                }

                this.emit('onPlayerLeft', message.arg.gameId, message.arg.player);

                break;
        }

        if(worker) {
            worker.lastMessage = Date.now();
        }
    }

    // Internal methods
    sendCommand(identity, command, arg) {
        const logLevel = (command === 'PING') ? 'debug' : 'info';
        logger[logLevel](`sending ${command} to ${identity}`);
        this.router.send([identity, '', JSON.stringify({ command: command, arg: arg })]).catch(err => {
            logger.error(`Error sending command: ${err}`);
        });
    }

    checkTimeouts() {
        var currentTime = Date.now();
        const pingTimeout = 30 * 1000;

        Object.values(this.workers).forEach(worker => {
            if(worker.pingSent && currentTime - worker.pingSent > pingTimeout) {
                logger.info(`worker ${worker.identity} timed out`);
                delete this.workers[worker.identity];
                this.emit('onWorkerTimedOut', worker.identity);
            } else if(!worker.pingSent) {
                if(currentTime - worker.lastMessage > pingTimeout) {
                    worker.pingSent = currentTime;
                    this.sendCommand(worker.identity, 'PING');
                }
            }
        });
    }

    close() {
        this.running = false;
        this.router.close();
    }
}

module.exports = GameRouter;
