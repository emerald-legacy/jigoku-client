const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const config = require("config");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const logger = require("./log.js");
const bcrypt = require("bcrypt");
const api = require("./api");
const path = require("path");
const jwt = require("jsonwebtoken");
const http = require("http");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const db = require("./db.js");

const fs = require("fs");
const UserService = require("./services/UserService.js");

// Project root: works for both `tsx server/` (source) and `node build/server/` (compiled)
const projectRoot = path.resolve(__dirname, "..", fs.existsSync(path.join(__dirname, "..", "views")) ? "" : "..");
const Settings = require("./settings.js");

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later" }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many authentication attempts, please try again later" }
});

class Server {
    constructor(isDeveloping) {
        this.isDeveloping = isDeveloping;
        this.app = app;
        // @ts-ignore
        this.server = http.Server(app);
    }

    async initDb() {
        const database = await db.connect(config.dbPath);
        this.userService = new UserService(database);
    }

    async init() {
        // Security headers with Helmet v7
        app.use(
            // @ts-ignore - helmet v7 types
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com", "https://www.gstatic.com"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        imgSrc: ["'self'", "data:", "https:"],
                        connectSrc: ["'self'", "wss:", "ws:", "https://www.emeralddb.org", "https://emeralddb.org"].concat(config.cspConnectSources || []),
                        fontSrc: ["'self'", "data:"],
                        frameSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
                        objectSrc: ["'none'"],
                        upgradeInsecureRequests: process.env.HTTPS === "false" ? null : []
                    }
                },
                crossOriginEmbedderPolicy: false // Needed for Socket.io compatibility
            })
        );

        app.set("trust proxy", 1);
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
                secure: config.https === true || config.https === "true",
                httpOnly: true, // SECURITY FIX: Prevent XSS access to cookies
                sameSite: "lax",
                // Omit domain for IP addresses — browsers handle IP cookies
                // correctly only when no domain attribute is set
                ...(config.domain && !/^\d+\.\d+\.\d+\.\d+$/.test(config.domain) ? { domain: config.domain } : {})
            },
            name: "sessionId"
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
        app.use("/api/", apiLimiter);
        app.use("/api/account/login", authLimiter);
        app.use("/api/account/register", authLimiter);
        app.use("/api/account/password-reset", authLimiter);

        api.init(app);

        app.use(express.static(path.join(projectRoot, "public")));
        app.set("view engine", "pug");
        app.set("views", path.join(projectRoot, "views"));

        // Health check endpoint
        app.get("/health", (req, res) => {
            res.json({
                status: "ok",
                timestamp: Date.now(),
                uptime: process.uptime()
            });
        });

        let useViteDev = false;
        if(this.isDeveloping) {
            try {
                const { createServer } = await import("vite");
                const vite = await createServer({
                    server: { middlewareMode: true },
                    appType: "custom"
                });
                app.use(vite.middlewares);
                useViteDev = true;
            } catch(_err) {
                logger.info("Vite not available, serving pre-built bundle from public/");
            }
        }

        // Load Vite manifest for production cache-busted filenames
        let manifest = {};
        if(!useViteDev) {
            try {
                const manifestPath = path.join(projectRoot, "public", ".vite", "manifest.json");
                manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
            } catch(_err) {
                logger.warn("Could not load .vite/manifest.json, falling back to default filenames");
            }
        }

        // Load card image version for cache busting
        let cardImageVersion = "";
        try {
            const versionPath = path.join(projectRoot, "public", "img", "cards", "version.json");
            const versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
            cardImageVersion = String(versionData.timestamp);
        } catch(_err) {
            // No version file — no cache busting for images
        }

        app.get("/{*splat}", (req, res) => {
            let token = undefined;
            /** @type {any} */
            const authReq = req;

            if(authReq.user) {
                token = jwt.sign(authReq.user, config.secret);
                const { blockList: _blockList, ...userWithoutBlockList } = authReq.user;
                authReq.user = userWithoutBlockList;
            }

            // Extract asset paths from Vite manifest
            const entry = manifest["client/index.tsx"] || {};
            const bundleJs = entry.file ? "/" + entry.file : "/assets/index.js";
            const cssFiles = (entry.css || []).map(f => "/" + f);
            const preloadJs = (entry.imports || [])
                .map(key => manifest[key]?.file)
                .filter(Boolean)
                .map(f => "/" + f);

            res.render("index", {
                basedir: path.join(projectRoot, "views"),
                user: Settings.getUserWithDefaultsSet(authReq.user),
                token: token,
                production: !useViteDev,
                bundleJs: bundleJs,
                cssFiles: cssFiles,
                preloadJs: preloadJs,
                cardImageVersion: cardImageVersion
            });
        });

        // Define error middleware last
        app.use(function(err, req, res, next) {
            logger.error(`Unhandled error on ${req.method} ${req.url}: ${err}`);
            if(res.headersSent) {
                return next(err);
            }
            res.status(500).send({ success: false });
        });

        return this.server;
    }

    run() {
        var port = config.lobby.port;

        this.server.listen(port, "0.0.0.0", function onStart(err) {
            if(err) {
                logger.error(`Server listen error: ${err}`);
            }

            logger.info("==> ?? Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.", port, port);
        });
    }

    async verifyUser(username, password, done) {
        try {
            const user = await this.userService.getUserByUsername(username);

            if(!user) {
                return done(null, false, { message: "Invalid username/password" });
            }

            const valid = await bcrypt.compare(password, user.password);

            if(!valid) {
                return done(null, false, { message: "Invalid username/password" });
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
            logger.error(`Authentication error: ${err}`);
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
                    return done(new Error("user not found"));
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
