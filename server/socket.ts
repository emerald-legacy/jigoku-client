import { EventEmitter } from "node:events";
import jwt from "jsonwebtoken";
import type { Socket as IoSocket } from "socket.io";

import logger from "./log.js";

type SocketConfig = { secret?: string };

interface SocketOptions {
    config: SocketConfig;
}

interface AuthUser {
    username: string;
    [key: string]: unknown;
}

class Socket extends EventEmitter {
    socket: IoSocket;
    user: AuthUser | undefined;
    config: SocketConfig;

    constructor(socket: IoSocket, options: SocketOptions) {
        super();

        this.socket = socket;
        this.user = (socket.request as { user?: AuthUser }).user;
        this.config = options.config;

        socket.on("error", this.onError.bind(this));
        socket.on("authenticate", this.onAuthenticate.bind(this));
        socket.on("disconnect", this.onDisconnect.bind(this));
    }

    get id() {
        return this.socket.id;
    }

    // Commands
    registerEvent(event: string, callback: (socket: Socket, ...args: unknown[]) => void) {
        this.socket.on(event, this.onSocketEvent.bind(this, callback));
    }

    joinChannel(channelName: string) {
        this.socket.join(channelName);
    }

    leaveChannel(channelName: string) {
        this.socket.leave(channelName);
    }

    send(message: string, ...args: unknown[]) {
        this.socket.emit(message, ...args);
    }

    disconnect() {
        this.socket.disconnect();
    }

    // Events
    onSocketEvent(callback: (socket: Socket, ...args: unknown[]) => void, ...args: unknown[]) {
        if(!this.user) {
            return;
        }

        try {
            callback(this, ...args);
        } catch(err) {
            logger.error(`Socket event error: ${err}`);
        }
    }

    onAuthenticate(token: string) {
        const cfg = this.config as { secret?: string; get?: (key: "secret") => string };
        const secret = cfg.secret ?? (cfg.get ? cfg.get("secret") : "");
        jwt.verify(token, secret, { algorithms: ["HS256"] }, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
            if(err) {
                logger.info(`JWT auth failed: ${err.message}`);
                return;
            }

            const user = decoded as AuthUser | undefined;
            if(!user || typeof user === "string") {
                return;
            }

            if(this.user && this.user.username !== user.username) {
                this.socket.disconnect();
                return;
            }
            (this.socket.request as { user?: AuthUser }).user = user;
            this.user = user;
            this.emit("authenticate", this, user);
        });
    }

    onDisconnect(reason: string) {
        this.emit("disconnect", this, reason);
    }

    onError(err: Error) {
        logger.info(`Socket.IO error: ${err}. Socket ID ${this.socket.id}`);
    }
}

export default Socket;
