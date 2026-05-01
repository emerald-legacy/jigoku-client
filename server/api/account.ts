const logger = require("../log.js");
const bcrypt = require("bcrypt");
const passport = require("passport");
const config = require("config");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { addHours, format } = require("date-fns");
const db = require("../db.js");
const UserService = require("../services/UserService.js");
const Settings = require("../settings.js");
const { wrapAsync } = require("../util.js");
const axios = require("axios").default;

function hashPassword(password, rounds) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, rounds, function (err, hash) {
            if(err) {
                return reject(err);
            }

            return resolve(hash);
        });
    });
}

function loginUser(request, user) {
    return new Promise<void>((resolve, reject) => {
        request.login(user, function (err) {
            if(err) {
                return reject(err);
            }

            resolve();
        });
    });
}

let emailTransport = null;

function getEmailTransport() {
    if(!emailTransport) {
        try {
            const emailConfig = typeof config.emailPath === "string"
                ? JSON.parse(config.emailPath)
                : config.emailPath;
            emailTransport = nodemailer.createTransport(emailConfig);
        } catch(_e) {
            throw new Error("Failed to initialise email transport: check EMAIL_PATH configuration");
        }
    }
    return emailTransport;
}

function sendEmail(address, email) {
    return new Promise<void>((resolve, reject) => {
        var emailTransport = getEmailTransport();

        emailTransport.sendMail({
            from: "Jigoku Online <noreply@jigoku.online>",
            to: address,
            subject: "Your account at Jigoku Online",
            text: email
        }, function (error) {
            if(error) {
                return reject(error);
            }

            resolve();
        });
    });
}

module.exports.init = function (server) {
    const userService = new UserService(db.getDb());

    async function checkAuth(req, res) {
        let user = await userService.getUserByUsername(req.params.username);

        if(!req.user) {
            res.status(401).send({ message: "Unauthorized" });
            return null;
        }

        if(req.user.username !== req.params.username) {
            res.status(403).send({ message: "Unauthorized" });
            return null;
        }

        if(!user) {
            res.status(404).send({ message: "Not found" });
            return null;
        }

        return user;
    }

    server.post("/api/account/register", wrapAsync(async (req, res) => {
        if(!req.body.password) {
            return res.send({ success: false, message: "No password specified" });
        }

        if(req.body.password.length < 8) {
            return res.send({ success: false, message: "Password must be at least 8 characters" });
        }

        if(!req.body.email) {
            return res.send({ success: false, message: "No email specified" });
        }

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
            return res.send({ success: false, message: "Please enter a valid email address" });
        }

        if(!req.body.username) {
            return res.send({ success: false, message: "No username specified" });
        }

        try {
            const existingEmail = await userService.getUserByEmail(req.body.email);
            if(existingEmail) {
                return res.send({ success: false, message: "An account with that email already exists, please use another" });
            }

            const existingUsername = await userService.getUserByUsername(req.body.username);
            if(existingUsername) {
                return res.send({ success: false, message: "An account with that name already exists, please choose another" });
            }

            const passwordHash = await hashPassword(req.body.password, 10);
            const user = {
                password: passwordHash,
                registered: new Date(),
                username: req.body.username,
                email: req.body.email,
                emailHash: crypto.createHash("md5").update(req.body.email).digest("hex"),
                settings: {
                    optionSettings: {
                        showRingEffects: true
                    }
                }
            };

            const newUser = await userService.addUser(user);
            await loginUser(req, newUser);

            const { password: _pw, resetToken: _rt, tokenExpires: _te, ...safeNewUser } = newUser;
            res.send({ success: true, user: Settings.getUserWithDefaultsSet(safeNewUser), token: jwt.sign(safeNewUser, config.secret, { expiresIn: "7d" }) });
        } catch(err: any) {
            if(err.code === 11000) {
                const field = err.keyPattern?.email ? "email" : "username";
                return res.send({ success: false, message: `An account with that ${field} already exists` });
            }
            logger.error(`Registration error: ${err}`);
            res.send({ success: false, message: "An error occured registering your account" });
        }
    }));

    server.post("/api/account/check-username", function (req, res) {
        userService.getUserByUsername(req.body.username)
            .then(user => {
                if(user) {
                    return res.send({ success: true, message: "An account with that name already exists, please choose another" });
                }

                return res.send({ success: true });
            })
            .catch(() => {
                return res.send({ success: false, message: "Error occured looking up username" });
            });
    });

    server.post("/api/account/logout", function (req, res) {
        req.logout(function(err) {
            if(err) {
                logger.error(`Logout error: ${err}`);
                return res.send({ success: false, message: "Error during logout" });
            }
            res.send({ success: true });
        });
    });

    server.post("/api/account/login", passport.authenticate("local"), function (req, res) {
        res.send({ success: true, user: req.user, token: jwt.sign(req.user, config.secret, { expiresIn: "7d" }) });
    });

    server.post("/api/account/password-reset-finish", wrapAsync(async (req, res) => {
        if(!req.body.id || !req.body.token || !req.body.newPassword) {
            return res.send({ success: false, message: "Invalid parameters" });
        }

        try {
            const user = await userService.getUserById(req.body.id);

            if(!user) {
                return res.send({ success: false, message: "An error occured resetting your password, check the url you have entered and try again" });
            }

            if(!user.resetToken) {
                logger.error(`Got unexpected reset request for user ${user.username}`);
                return res.send({ success: false, message: "An error occured resetting your password, check the url you have entered and try again" });
            }

            const now = new Date();
            if(new Date(user.tokenExpires) < now) {
                logger.error(`Token expired for ${user.username}`);
                return res.send({ success: false, message: "The reset token you have provided has expired" });
            }

            const hmac = crypto.createHmac("sha512", config.hmacSecret);
            const expectedToken = hmac.update("RESET " + user.username + " " + user.tokenExpires).digest("hex");

            if(!crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(req.body.token))) {
                logger.error(`Invalid reset token for ${user.username}`);
                return res.send({ success: false, message: "An error occured resetting your password, check the url you have entered and try again" });
            }

            const passwordHash = await hashPassword(req.body.newPassword, 10);
            await userService.setPassword(user, passwordHash);
            await userService.clearResetToken(user);

            res.send({ success: true });
        } catch(err) {
            logger.error(`Password reset error: ${err}`);
            res.send({ success: false, message: "An error occured resetting your password, check the url you have entered and try again" });
        }
    }));

    server.post("/api/account/password-reset", wrapAsync(async (req, res) => {
        // SECURITY FIX: Use config for captcha secret instead of hardcoded value
        const captchaSecret = config.captchaKey;
        if(!captchaSecret) {
            logger.warn("CAPTCHA_KEY not configured, skipping captcha verification");
            return res.send({ success: false, message: "Server configuration error" });
        }

        try {
            const captchaParams = new URLSearchParams();
            captchaParams.append("secret", captchaSecret);
            captchaParams.append("response", req.body.captcha);
            const captchaResponse = await axios.post("https://www.google.com/recaptcha/api/siteverify", captchaParams);

            if(!captchaResponse.data.success) {
                return res.send({ success: false, message: "Please complete the captcha correctly" });
            }

            // Send success response immediately (email sending happens async)
            res.send({ success: true });

            // Continue processing in background
            const user = await userService.getUserByUsername(req.body.username);
            if(!user) {
                logger.error(`Username not found for password reset: ${req.body.username}`);
                return;
            }

            const expiration = addHours(new Date(), 4);
            const formattedExpiration = format(expiration, "yyyyMMdd-HH:mm:ss");
            const hmac = crypto.createHmac("sha512", config.hmacSecret);
            const resetToken = hmac.update("RESET " + user.username + " " + formattedExpiration).digest("hex");

            await userService.setResetToken(user, resetToken, formattedExpiration);

            const url = "https://jigoku.online/reset-password?id=" + user._id + "&token=" + resetToken;
            const emailText = "Hi,\n\nSomeone, hopefully you, has requested their password on Jigoku Online (https://jigoku.online) to be reset.  If this was you, click this link " + url + " to complete the process.\n\n" +
                "If you did not request this reset, do not worry, your account has not been affected and your password has not been changed, just ignore this email.\n" +
                "Kind regards,\n\n" +
                "The Jigoku Online team";

            await sendEmail(user.email, emailText);
        } catch(err) {
            logger.error(`Password reset error: ${err}`);
            // Only send error if we haven't already sent success
            if(!res.headersSent) {
                return res.send({ success: false, message: "There was a problem verifying the captcha, please try again" });
            }
        }
    }));

    function updateUser(res, user) {
        return userService.update(user)
            .then(() => {
                res.send({
                    success: true, user: {
                        username: user.username,
                        email: user.email,
                        emailHash: user.emailHash,
                        _id: user._id,
                        admin: user.admin,
                        settings: user.settings,
                        promptedActionWindows: user.promptedActionWindows,
                        permissions: user.permissions || {}
                    }, token: jwt.sign({
                        username: user.username,
                        email: user.email,
                        emailHash: user.emailHash,
                        _id: user._id,
                        admin: user.admin,
                        settings: user.settings,
                        promptedActionWindows: user.promptedActionWindows,
                        permissions: user.permissions || {}
                    }, config.secret, { expiresIn: "7d" })
                });
            })
            .catch(() => {
                return res.send({ success: false, message: "An error occured updating your user profile" });
            });
    }

    server.put("/api/account/:username", wrapAsync(async (req, res) => {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        if(req.user.username !== req.params.username) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        let userToSet;
        try {
            userToSet = JSON.parse(req.body.data);
        } catch(_e) {
            return res.status(400).send({ success: false, message: "Invalid request data" });
        }

        try {
            const user = await userService.getUserByUsername(req.params.username);

            if(!user) {
                return res.status(404).send({ message: "Not found" });
            }

            user.email = userToSet.email;
            user.settings = userToSet.settings;
            user.promptedActionWindows = userToSet.promptedActionWindows;

            if(userToSet.password && userToSet.password !== "") {
                user.password = await hashPassword(userToSet.password, 10);
            }

            await updateUser(res, user);
        } catch(_e) {
            return res.send({ success: false, message: "An error occured updating your user profile" });
        }
    }));

    server.get("/api/account/:username/blocklist", wrapAsync(async (req, res) => {
        let user = await checkAuth(req, res);

        if(!user) {
            return;
        }

        res.send({ success: true, blockList: user.blockList });
    }));

    server.post("/api/account/:username/blocklist", wrapAsync(async (req, res) => {
        let user = await checkAuth(req, res);

        if(!user) {
            return;
        }

        if(!user.blockList) {
            user.blockList = [];
        }

        if(user.blockList.find(u => u === req.body.username.toLowerCase())) {
            return res.send({ success: false, message: "Entry already on block list" });
        }

        user.blockList.push(req.body.username.toLowerCase());

        await userService.updateBlockList(user);

        res.send({ success: true, message: "Block list entry added successfully", username: req.body.username.toLowerCase() });
    }));

    server.delete("/api/account/:username/blocklist/:entry", wrapAsync(async (req, res) => {
        let user = await checkAuth(req, res);

        if(!user) {
            return;
        }

        if(!req.params.entry) {
            return res.send({ success: false, message: "Parameter \"entry\" is required" });
        }

        if(!user.blockList) {
            user.blockList = [];
        }

        if(!user.blockList.find(u => u === req.params.entry.toLowerCase())) {
            return res.status(404).send({ message: "Not found" });
        }

        user.blockList = user.blockList.filter(u => u !== req.params.entry.toLowerCase());

        await userService.updateBlockList(user);

        res.send({ success: true, message: "Block list entry removed successfully", username: req.params.entry.toLowerCase() });
    }));
};
