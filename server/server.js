const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const config = require('config');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const logger = require('./log.js');
const bcrypt = require('bcrypt');
const api = require('./api');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config.js');
const db = require('./db.js');

const UserService = require('./services/UserService.js');
const Settings = require('./settings.js');

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later' }
});

class Server {
    constructor(isDeveloping) {
        this.isDeveloping = isDeveloping;
        // @ts-ignore
        this.server = http.Server(app);
    }

    async initDb() {
        const database = await db.connect(config.dbPath);
        this.userService = new UserService(database);
    }

    init() {
        // Security headers with Helmet v7
        app.use(
            // @ts-ignore - helmet v7 types
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ['\'self\''],
                        scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://www.google.com', 'https://www.gstatic.com'],
                        styleSrc: ['\'self\'', '\'unsafe-inline\''],
                        imgSrc: ['\'self\'', 'data:', 'https:'],
                        connectSrc: ['\'self\'', 'wss:', 'ws:', 'https://www.emeralddb.org', 'https://emeralddb.org'].concat(config.cspConnectSources || []),
                        fontSrc: ['\'self\'', 'data:'],
                        frameSrc: ['\'self\'', 'https://www.google.com', 'https://www.gstatic.com'],
                        objectSrc: ['\'none\''],
                        upgradeInsecureRequests: process.env.HTTPS === 'false' ? null : []
                    }
                },
                crossOriginEmbedderPolicy: false // Needed for Socket.io compatibility
            })
        );

        app.set('trust proxy', 1);
        app.use(session({
            store: MongoStore.create({
                mongoUrl: config.dbPath,
                ttl: config.cookieLifetime ? config.cookieLifetime / 1000 : 14 * 24 * 60 * 60 // Default 14 days in seconds
            }),
            saveUninitialized: false,
            resave: false,
            secret: config.secret,
            cookie: {
                maxAge: config.cookieLifetime,
                secure: config.https,
                httpOnly: true, // SECURITY FIX: Prevent XSS access to cookies
                sameSite: 'lax',
                // Omit domain for IP addresses — browsers handle IP cookies
                // correctly only when no domain attribute is set
                ...(config.domain && !/^\d+\.\d+\.\d+\.\d+$/.test(config.domain) ? { domain: config.domain } : {})
            },
            name: 'sessionId'
        }));

        app.use(passport.initialize());
        app.use(passport.session());

        passport.use(new localStrategy(this.verifyUser.bind(this)));
        passport.serializeUser(this.serializeUser.bind(this));
        passport.deserializeUser(this.deserializeUser.bind(this));

        app.use(cookieParser());
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        // Apply rate limiting to API routes
        app.use('/api/', apiLimiter);
        app.use('/api/account/login', authLimiter);
        app.use('/api/account/register', authLimiter);
        app.use('/api/account/password-reset', authLimiter);

        api.init(app);

        app.use(express.static(__dirname + '/../public'));
        app.set('view engine', 'pug');
        app.set('views', path.join(__dirname, '..', 'views'));

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: Date.now(),
                uptime: process.uptime()
            });
        });

        if(this.isDeveloping) {
            /** @type {any} */
            const wpConfig = webpackConfig;
            const compiler = webpack(wpConfig);
            const middleware = webpackDevMiddleware(compiler, {
                publicPath: webpackConfig.output.publicPath
            });

            app.use(middleware);
            app.use(webpackHotMiddleware(compiler, {
                log: false,
                path: '/__webpack_hmr',
                heartbeat: 2000
            }));
        }

        app.get('/{*splat}', (req, res) => {
            let token = undefined;
            /** @type {any} */
            const authReq = req;

            if(authReq.user) {
                token = jwt.sign(authReq.user, config.secret);
                const { blockList, ...userWithoutBlockList } = authReq.user;
                authReq.user = userWithoutBlockList;
            }

            res.render('index', { basedir: path.join(__dirname, '..', 'views'), user: Settings.getUserWithDefaultsSet(authReq.user), token: token, production: !this.isDeveloping });
        });

        // Define error middleware last
        app.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
            res.status(500).send({ success: false });
            logger.error(err);
        });

        return this.server;
    }

    run() {
        var port = config.lobby.port;

        this.server.listen(port, '0.0.0.0', function onStart(err) {
            if(err) {
                logger.error(err);
            }

            logger.info('==> ?? Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
        });
    }

    async verifyUser(username, password, done) {
        try {
            const user = await this.userService.getUserByUsername(username);

            if(!user) {
                return done(null, false, { message: 'Invalid username/password' });
            }

            const valid = await bcrypt.compare(password, user.password);

            if(!valid) {
                return done(null, false, { message: 'Invalid username/password' });
            }

            let userObj = {
                username: user.username,
                email: user.email,
                emailHash: user.emailHash,
                _id: user._id,
                admin: user.admin,
                settings: user.settings,
                promptedActionWindows: user.promptedActionWindows,
                permissions: user.permissions,
                blockList: user.blockList
            };

            userObj = Settings.getUserWithDefaultsSet(userObj);

            return done(null, userObj);
        } catch(err) {
            logger.error('Authentication error:', err);
            return done(err);
        }
    }

    serializeUser(user, done) {
        if(user) {
            done(null, user._id);
        }
    }

    deserializeUser(id, done) {
        this.userService.getUserById(id)
            .then(user => {
                if(!user) {
                    return done(new Error('user not found'));
                }

                let userObj = {
                    username: user.username,
                    email: user.email,
                    emailHash: user.emailHash,
                    _id: user._id,
                    admin: user.admin,
                    settings: user.settings,
                    promptedActionWindows: user.promptedActionWindows,
                    permissions: user.permissions,
                    blockList: user.blockList
                };

                done(null, userObj);
            });
    }
}
module.exports = Server;
