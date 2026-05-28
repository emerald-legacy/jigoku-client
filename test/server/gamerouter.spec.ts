// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";

vi.mock("../../server/log.js", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock("../../server/db.js", () => ({
    default: { getDb: vi.fn(() => null) }
}));

import GameRouter from "../../server/gamerouter.js";
import logger from "../../server/log.js";

type RouterCtx = EventEmitter & {
    workers: Record<string, ReturnType<typeof makeWorker>>;
    connections: Map<string, FakeWs>;
    sendCommand: ReturnType<typeof vi.fn>;
    updateDeckStats: ReturnType<typeof vi.fn>;
    gameService: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    gameStatsService: { invalidateCache: ReturnType<typeof vi.fn> };
    deckStatsService: { recordGameResult: ReturnType<typeof vi.fn> };
    gameErrorService: { addError: ReturnType<typeof vi.fn> };
};

const proto = (GameRouter as unknown as { prototype: Record<string, (...args: unknown[]) => unknown> }).prototype;

function call<T = unknown>(method: string, ctx: unknown, ...args: unknown[]): T {
    return proto[method].apply(ctx, args) as T;
}

function makeWorker(overrides: Partial<{
    identity: string;
    maxGames: number;
    numGames: number;
    address: string;
    port: number;
    protocol: string;
    version: string;
    disabled: boolean;
    pingSent: number | undefined;
    lastMessage: number | undefined;
}> = {}) {
    return {
        identity: "node-1",
        maxGames: 10,
        numGames: 0,
        address: "127.0.0.1",
        port: 9500,
        protocol: "ws",
        version: "test",
        disabled: false,
        pingSent: undefined as number | undefined,
        lastMessage: Date.now(),
        ...overrides
    };
}

type FakeWs = { readyState: number; send: ReturnType<typeof vi.fn> };

function makeWs(open = true, sendImpl?: (data: string) => void): FakeWs {
    return {
        readyState: open ? 1 : 3,
        send: vi.fn(sendImpl)
    };
}

function makeRouterCtx(overrides: Partial<RouterCtx> = {}): RouterCtx {
    const ctx = Object.assign(new EventEmitter(), {
        workers: {},
        connections: new Map(),
        sendCommand: vi.fn(),
        updateDeckStats: vi.fn(),
        gameService: { create: vi.fn(), update: vi.fn() },
        gameStatsService: { invalidateCache: vi.fn() },
        deckStatsService: { recordGameResult: vi.fn().mockResolvedValue(undefined) },
        gameErrorService: { addError: vi.fn().mockResolvedValue(undefined) },
        ...overrides
    }) as RouterCtx;
    vi.spyOn(ctx, "emit");
    return ctx;
}

beforeEach(() => {
    vi.mocked(logger.info).mockClear();
    vi.mocked(logger.debug).mockClear();
    vi.mocked(logger.warn).mockClear();
    vi.mocked(logger.error).mockClear();
});

describe("GameRouter.getNextAvailableGameNode", () => {
    it("returns undefined when no workers are registered", () => {
        const ctx = makeRouterCtx();
        expect(call("getNextAvailableGameNode", ctx)).toBeUndefined();
    });

    it("returns undefined when all workers are disabled", () => {
        const ctx = makeRouterCtx({
            workers: {
                "node-1": makeWorker({ identity: "node-1", disabled: true }),
                "node-2": makeWorker({ identity: "node-2", disabled: true })
            }
        });
        expect(call("getNextAvailableGameNode", ctx)).toBeUndefined();
    });

    it("returns undefined when all workers are at maxGames", () => {
        const ctx = makeRouterCtx({
            workers: {
                "node-1": makeWorker({ identity: "node-1", maxGames: 2, numGames: 2 }),
                "node-2": makeWorker({ identity: "node-2", maxGames: 1, numGames: 1 })
            }
        });
        expect(call("getNextAvailableGameNode", ctx)).toBeUndefined();
    });

    it("picks the worker with the fewest games", () => {
        const ctx = makeRouterCtx({
            workers: {
                "node-1": makeWorker({ identity: "node-1", numGames: 5 }),
                "node-2": makeWorker({ identity: "node-2", numGames: 2 }),
                "node-3": makeWorker({ identity: "node-3", numGames: 8 })
            }
        });
        const picked = call<{ identity: string } | undefined>("getNextAvailableGameNode", ctx);
        expect(picked?.identity).toBe("node-2");
    });

    it("skips disabled workers even when they have fewer games", () => {
        const ctx = makeRouterCtx({
            workers: {
                "node-1": makeWorker({ identity: "node-1", numGames: 5 }),
                "node-2": makeWorker({ identity: "node-2", numGames: 0, disabled: true })
            }
        });
        expect(call<{ identity: string }>("getNextAvailableGameNode", ctx).identity).toBe("node-1");
    });
});

describe("GameRouter.getNodeStatus", () => {
    it("returns empty array when no workers", () => {
        const ctx = makeRouterCtx();
        expect(call("getNodeStatus", ctx)).toEqual([]);
    });

    it("maps workers to status summaries", () => {
        const ctx = makeRouterCtx({
            workers: {
                "node-1": makeWorker({ identity: "node-1", numGames: 3, version: "1.0", disabled: false }),
                "node-2": makeWorker({ identity: "node-2", numGames: 0, version: "1.1", disabled: true })
            }
        });
        expect(call("getNodeStatus", ctx)).toEqual([
            { name: "node-1", numGames: 3, status: "active", version: "1.0" },
            { name: "node-2", numGames: 0, status: "disabled", version: "1.1" }
        ]);
    });
});

describe("GameRouter.disableNode / enableNode", () => {
    it("disableNode flips the disabled flag and returns true", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1", disabled: false }) } });
        expect(call("disableNode", ctx, "node-1")).toBe(true);
        expect(ctx.workers["node-1"].disabled).toBe(true);
    });

    it("disableNode returns false for unknown worker", () => {
        const ctx = makeRouterCtx();
        expect(call("disableNode", ctx, "missing")).toBe(false);
    });

    it("enableNode flips the disabled flag and returns true", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1", disabled: true }) } });
        expect(call("enableNode", ctx, "node-1")).toBe(true);
        expect(ctx.workers["node-1"].disabled).toBe(false);
    });

    it("enableNode returns false for unknown worker", () => {
        const ctx = makeRouterCtx();
        expect(call("enableNode", ctx, "missing")).toBe(false);
    });
});

describe("GameRouter.sendCommand", () => {
    it("sends JSON over the matching connection when ws is open", () => {
        const ws = makeWs(true);
        const ctx = makeRouterCtx({ connections: new Map([["node-1", ws]]), sendCommand: undefined as unknown as RouterCtx["sendCommand"] });
        call("sendCommand", ctx, "node-1", "CLOSEGAME", { gameId: "g1" });
        expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ command: "CLOSEGAME", arg: { gameId: "g1" } }));
    });

    it("logs and skips when no ws is registered for identity", () => {
        const ctx = makeRouterCtx({ sendCommand: undefined as unknown as RouterCtx["sendCommand"] });
        call("sendCommand", ctx, "missing", "CLOSEGAME", { gameId: "g1" });
        expect(logger.error).toHaveBeenCalledWith("Cannot send CLOSEGAME to missing: not connected");
    });

    it("logs and skips when ws is not in OPEN state", () => {
        const ws = makeWs(false);
        const ctx = makeRouterCtx({ connections: new Map([["node-1", ws]]), sendCommand: undefined as unknown as RouterCtx["sendCommand"] });
        call("sendCommand", ctx, "node-1", "CLOSEGAME", { gameId: "g1" });
        expect(ws.send).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith("Cannot send CLOSEGAME to node-1: not connected");
    });

    it("uses debug log level for PING and info for other commands", () => {
        const ws = makeWs(true);
        const ctx = makeRouterCtx({ connections: new Map([["node-1", ws]]), sendCommand: undefined as unknown as RouterCtx["sendCommand"] });
        call("sendCommand", ctx, "node-1", "PING");
        expect(logger.debug).toHaveBeenCalledWith("sending PING to node-1");
        call("sendCommand", ctx, "node-1", "CLOSEGAME", { gameId: "x" });
        expect(logger.info).toHaveBeenCalledWith("sending CLOSEGAME to node-1");
    });

    it("catches and logs ws.send errors", () => {
        const ws = makeWs(true, () => { throw new Error("kaboom"); });
        const ctx = makeRouterCtx({ connections: new Map([["node-1", ws]]), sendCommand: undefined as unknown as RouterCtx["sendCommand"] });
        call("sendCommand", ctx, "node-1", "CLOSEGAME", { gameId: "g1" });
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Error sending command"));
    });
});

describe("GameRouter.startGame", () => {
    it("returns undefined and logs when no node is available", () => {
        const ctx = Object.assign(makeRouterCtx(), { getNextAvailableGameNode: vi.fn(() => undefined) });
        const result = call("startGame", ctx, { id: "g1" });
        expect(result).toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith("Could not find new node for game");
    });

    it("increments numGames, creates a save state, and sends STARTGAME", () => {
        const worker = makeWorker({ identity: "node-1", numGames: 2 });
        const ctx = Object.assign(makeRouterCtx({ workers: { "node-1": worker } }), {
            getNextAvailableGameNode: vi.fn(() => worker)
        });
        const saveState = { gameId: "g1", players: [] };
        const game = { id: "g1", getSaveState: () => saveState };

        const result = call<{ identity: string } | undefined>("startGame", ctx, game);

        expect(result?.identity).toBe("node-1");
        expect(worker.numGames).toBe(3);
        expect(ctx.gameService.create).toHaveBeenCalledWith(saveState);
        expect(ctx.sendCommand).toHaveBeenCalledWith("node-1", "STARTGAME", game);
    });
});

describe("GameRouter.addSpectator", () => {
    it("does nothing when game.node is falsy", () => {
        const ctx = makeRouterCtx();
        call("addSpectator", ctx, { id: "g1", node: null }, { username: "u1" });
        expect(ctx.sendCommand).not.toHaveBeenCalled();
    });

    it("sends SPECTATOR with game + user to the node", () => {
        const ctx = makeRouterCtx();
        const game = { id: "g1", node: { identity: "node-1" } };
        const user = { username: "u1" };
        call("addSpectator", ctx, game, user);
        expect(ctx.sendCommand).toHaveBeenCalledWith("node-1", "SPECTATOR", { game: game, user: user });
    });
});

describe("GameRouter.notifyFailedConnect", () => {
    it("does nothing when game.node is falsy", () => {
        const ctx = makeRouterCtx();
        call("notifyFailedConnect", ctx, { id: "g1", node: null }, "alice");
        expect(ctx.sendCommand).not.toHaveBeenCalled();
    });

    it("sends CONNECTFAILED with gameId + username", () => {
        const ctx = makeRouterCtx();
        call("notifyFailedConnect", ctx, { id: "g1", node: { identity: "node-1" } }, "alice");
        expect(ctx.sendCommand).toHaveBeenCalledWith("node-1", "CONNECTFAILED", { gameId: "g1", username: "alice" });
    });
});

describe("GameRouter.closeGame", () => {
    it("does nothing when game.node is falsy", () => {
        const ctx = makeRouterCtx();
        call("closeGame", ctx, { id: "g1", node: null });
        expect(ctx.sendCommand).not.toHaveBeenCalled();
    });

    it("sends CLOSEGAME with gameId", () => {
        const ctx = makeRouterCtx();
        call("closeGame", ctx, { id: "g1", node: { identity: "node-1" } });
        expect(ctx.sendCommand).toHaveBeenCalledWith("node-1", "CLOSEGAME", { gameId: "g1" });
    });
});

describe("GameRouter.onMessage", () => {
    function encode(obj: unknown) {
        return { toString: () => JSON.stringify(obj) };
    }

    it("logs and returns when JSON is malformed", () => {
        const ctx = makeRouterCtx();
        call("onMessage", ctx, "node-1", { toString: () => "{not-json" });
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to parse message"));
    });

    it("logs and returns when command is unrecognised", () => {
        const ctx = makeRouterCtx();
        call("onMessage", ctx, "node-1", encode({ command: "WAT", arg: {} }));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Unrecognised message"));
    });

    it("HEARTBEAT from unknown worker triggers REGISTER and does not register the worker", () => {
        const ctx = makeRouterCtx();
        call("onMessage", ctx, "node-x", encode({ command: "HEARTBEAT" }));
        expect(ctx.sendCommand).toHaveBeenCalledWith("node-x", "REGISTER");
        expect(ctx.workers["node-x"]).toBeUndefined();
    });

    it("HEARTBEAT from known worker updates lastMessage", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-28T10:00:00Z"));
        const worker = makeWorker({ identity: "node-1", lastMessage: 0 });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("onMessage", ctx, "node-1", encode({ command: "HEARTBEAT" }));
        expect(worker.lastMessage).toBe(Date.now());
        expect(ctx.sendCommand).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it("PONG clears pingSent on known worker", () => {
        const worker = makeWorker({ identity: "node-1", pingSent: 12345 });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("onMessage", ctx, "node-1", encode({ command: "PONG" }));
        expect(worker.pingSent).toBeUndefined();
    });

    it("PONG from unknown worker logs error", () => {
        const ctx = makeRouterCtx();
        call("onMessage", ctx, "node-x", encode({ command: "PONG" }));
        expect(logger.error).toHaveBeenCalledWith("PONG received for unknown worker");
    });

    it("HELLO registers the worker, emits onWorkerStarted + onNodeReconnected, and seeds numGames from arg.games length", () => {
        const ctx = makeRouterCtx();
        const arg = {
            maxGames: 5,
            address: "host",
            port: 9500,
            protocol: "ws",
            version: "v2",
            games: [{ id: "g1" }, { id: "g2" }]
        };
        call("onMessage", ctx, "node-1", encode({ command: "HELLO", arg }));
        expect(ctx.emit).toHaveBeenCalledWith("onWorkerStarted", "node-1");
        expect(ctx.emit).toHaveBeenCalledWith("onNodeReconnected", "node-1", arg.games);
        expect(ctx.workers["node-1"]).toMatchObject({
            identity: "node-1",
            maxGames: 5,
            address: "host",
            port: 9500,
            protocol: "ws",
            version: "v2",
            numGames: 2
        });
    });

    it("HELLO defaults missing fields (maxGames=20, address='', port=0, protocol='ws', version='unknown')", () => {
        const ctx = makeRouterCtx();
        call("onMessage", ctx, "node-1", encode({ command: "HELLO", arg: {} }));
        expect(ctx.workers["node-1"]).toMatchObject({
            maxGames: 20,
            address: "",
            port: 0,
            protocol: "ws",
            version: "unknown",
            numGames: 0
        });
    });

    it("GAMEWIN with valid payload updates gameService, invalidates stats cache, and calls updateDeckStats", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1" }) } });
        const game = { gameId: "g1", winner: "alice", players: [{ name: "alice" }, { name: "bob" }] };
        call("onMessage", ctx, "node-1", encode({ command: "GAMEWIN", arg: { game } }));
        expect(ctx.gameService.update).toHaveBeenCalledWith(game);
        expect(ctx.gameStatsService.invalidateCache).toHaveBeenCalledTimes(1);
        expect(ctx.updateDeckStats).toHaveBeenCalledWith(game);
    });

    it("GAMEWIN with missing gameId logs error and does not update", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1" }) } });
        const game = { winner: "alice", players: [{ name: "alice" }] };
        call("onMessage", ctx, "node-1", encode({ command: "GAMEWIN", arg: { game } }));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Invalid GAMEWIN payload"));
        expect(ctx.gameService.update).not.toHaveBeenCalled();
    });

    it("GAMEWIN where winner is not in players list logs error and does not update", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1" }) } });
        const game = { gameId: "g1", winner: "ghost", players: [{ name: "alice" }, { name: "bob" }] };
        call("onMessage", ctx, "node-1", encode({ command: "GAMEWIN", arg: { game } }));
        expect(logger.error).toHaveBeenCalled();
        expect(ctx.gameService.update).not.toHaveBeenCalled();
    });

    it("GAMECLOSED on known worker decrements numGames and emits onGameClosed", () => {
        const worker = makeWorker({ identity: "node-1", numGames: 3 });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("onMessage", ctx, "node-1", encode({ command: "GAMECLOSED", arg: { game: "g1" } }));
        expect(worker.numGames).toBe(2);
        expect(ctx.emit).toHaveBeenCalledWith("onGameClosed", "g1");
    });

    it("GAMECLOSED on unknown worker logs error but still emits onGameClosed", () => {
        const ctx = makeRouterCtx();
        call("onMessage", ctx, "ghost", encode({ command: "GAMECLOSED", arg: { game: "g1" } }));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Got close game for non existent worker"));
        expect(ctx.emit).toHaveBeenCalledWith("onGameClosed", "g1");
    });

    it("PLAYERLEFT non-spectator updates gameService and emits onPlayerLeft", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1" }) } });
        const game = { gameId: "g1" };
        call("onMessage", ctx, "node-1", encode({ command: "PLAYERLEFT", arg: { gameId: "g1", game, player: "alice", spectator: false } }));
        expect(ctx.gameService.update).toHaveBeenCalledWith(game);
        expect(ctx.emit).toHaveBeenCalledWith("onPlayerLeft", "g1", "alice");
    });

    it("PLAYERLEFT spectator does not update gameService", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1" }) } });
        call("onMessage", ctx, "node-1", encode({ command: "PLAYERLEFT", arg: { gameId: "g1", game: { gameId: "g1" }, player: "alice", spectator: true } }));
        expect(ctx.gameService.update).not.toHaveBeenCalled();
        expect(ctx.emit).toHaveBeenCalledWith("onPlayerLeft", "g1", "alice");
    });

    it("GAMEERROR with valid arg persists via gameErrorService.addError", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1" }) } });
        const arg = {
            gameId: "g1",
            gameName: "test",
            players: ["alice", "bob"],
            errorMessage: "boom",
            errorStack: "stack",
            timestamp: "2026-05-28T10:00:00Z",
            debugData: { foo: 1 }
        };
        call("onMessage", ctx, "node-1", encode({ command: "GAMEERROR", arg }));
        expect(ctx.gameErrorService.addError).toHaveBeenCalledWith(expect.objectContaining({
            gameId: "g1",
            errorMessage: "boom",
            timestamp: expect.any(Date)
        }));
    });

    it("GAMEERROR with missing required fields logs error and does not persist", () => {
        const ctx = makeRouterCtx({ workers: { "node-1": makeWorker({ identity: "node-1" }) } });
        call("onMessage", ctx, "node-1", encode({ command: "GAMEERROR", arg: { gameId: "g1" } }));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Invalid GAMEERROR payload"));
        expect(ctx.gameErrorService.addError).not.toHaveBeenCalled();
    });

    it("touches worker.lastMessage on any recognised inbound", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-28T10:00:00Z"));
        const worker = makeWorker({ identity: "node-1", lastMessage: 1 });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("onMessage", ctx, "node-1", encode({ command: "HEARTBEAT" }));
        expect(worker.lastMessage).toBe(Date.now());
        vi.useRealTimers();
    });
});

describe("GameRouter.updateDeckStats", () => {
    it("returns early when game is null/undefined", () => {
        const ctx = makeRouterCtx();
        call("updateDeckStats", ctx, undefined);
        call("updateDeckStats", ctx, null);
        expect(ctx.deckStatsService.recordGameResult).not.toHaveBeenCalled();
    });

    it("returns early when winner or winReason is missing", () => {
        const ctx = makeRouterCtx();
        call("updateDeckStats", ctx, { players: [{ name: "a", deckId: "d1" }], winReason: "honor" });
        call("updateDeckStats", ctx, { players: [{ name: "a", deckId: "d1" }], winner: "a" });
        expect(ctx.deckStatsService.recordGameResult).not.toHaveBeenCalled();
    });

    it("records a result per player (won=true for winner) and uses opponent.faction normalized as 'crab'", () => {
        const ctx = makeRouterCtx();
        call("updateDeckStats", ctx, {
            players: [
                { name: "alice", deckId: "d-alice", faction: "Crane Clan" },
                { name: "bob", deckId: "d-bob", faction: "Crab Clan" }
            ],
            winner: "alice",
            winReason: "honor"
        });
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenCalledTimes(2);
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenNthCalledWith(1, "d-alice", {
            won: true,
            opponentClan: "crab",
            winReason: "honor",
            username: "alice"
        });
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenNthCalledWith(2, "d-bob", {
            won: false,
            opponentClan: "crane",
            winReason: "honor",
            username: "bob"
        });
    });

    it("skips players without a deckId", () => {
        const ctx = makeRouterCtx();
        call("updateDeckStats", ctx, {
            players: [
                { name: "alice", deckId: "d-alice", faction: "crab" },
                { name: "bob", faction: "crane" }
            ],
            winner: "alice",
            winReason: "honor"
        });
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenCalledTimes(1);
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenCalledWith("d-alice", expect.objectContaining({ username: "alice" }));
    });

    it("normalizes opponent clan strings (already lowercase, no 'Clan' suffix)", () => {
        const ctx = makeRouterCtx();
        call("updateDeckStats", ctx, {
            players: [
                { name: "alice", deckId: "d-alice", faction: "crab" },
                { name: "bob", deckId: "d-bob", faction: "crane" }
            ],
            winner: "alice",
            winReason: "honor"
        });
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenNthCalledWith(1, "d-alice", expect.objectContaining({ opponentClan: "crane" }));
    });

    it("yields null opponentClan when opponent has no faction", () => {
        const ctx = makeRouterCtx();
        call("updateDeckStats", ctx, {
            players: [
                { name: "alice", deckId: "d-alice", faction: "crab" },
                { name: "bob", deckId: "d-bob" }
            ],
            winner: "alice",
            winReason: "honor"
        });
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenNthCalledWith(1, "d-alice", expect.objectContaining({ opponentClan: null }));
    });

    it("works when players is a Record (not an Array)", () => {
        const ctx = makeRouterCtx();
        call("updateDeckStats", ctx, {
            players: {
                alice: { name: "alice", deckId: "d-alice", faction: "crab" },
                bob: { name: "bob", deckId: "d-bob", faction: "crane" }
            },
            winner: "alice",
            winReason: "honor"
        });
        expect(ctx.deckStatsService.recordGameResult).toHaveBeenCalledTimes(2);
    });
});

describe("GameRouter.checkTimeouts", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-28T10:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("does nothing for fresh workers", () => {
        const worker = makeWorker({ identity: "node-1", lastMessage: Date.now() });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("checkTimeouts", ctx);
        expect(ctx.sendCommand).not.toHaveBeenCalled();
        expect(ctx.workers["node-1"]).toBeDefined();
    });

    it("sends PING and marks pingSent when worker has been idle longer than the timeout", () => {
        const worker = makeWorker({ identity: "node-1", lastMessage: Date.now() - 31_000 });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("checkTimeouts", ctx);
        expect(ctx.sendCommand).toHaveBeenCalledWith("node-1", "PING");
        expect(worker.pingSent).toBe(Date.now());
    });

    it("removes a worker and emits onWorkerTimedOut after PING goes unanswered past the timeout", () => {
        const worker = makeWorker({ identity: "node-1", pingSent: Date.now() - 31_000 });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("checkTimeouts", ctx);
        expect(ctx.workers["node-1"]).toBeUndefined();
        expect(ctx.emit).toHaveBeenCalledWith("onWorkerTimedOut", "node-1");
    });

    it("leaves a worker with a pending ping in place until the timeout actually elapses", () => {
        const worker = makeWorker({ identity: "node-1", pingSent: Date.now() - 5_000 });
        const ctx = makeRouterCtx({ workers: { "node-1": worker } });
        call("checkTimeouts", ctx);
        expect(ctx.workers["node-1"]).toBeDefined();
        expect(ctx.sendCommand).not.toHaveBeenCalled();
    });
});
