// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";

import Lobby from "../../server/lobby.js";
import PendingGame from "../../server/pendinggame.js";

type Status = "lobby" | "playing" | "spectating";

type LobbyCtx = {
    users: Record<string, { username: string; emailHash?: string; settings?: { disableGravatar?: boolean } }>;
    games: Record<string, { players: Record<string, { left?: boolean }>; spectators: Record<string, unknown> }>;
    getUserStatus: (name: string) => Status;
};

const proto = (Lobby as unknown as { prototype: {
    getUserStatus: (this: LobbyCtx, n: string) => Status;
    getUserList: (this: LobbyCtx) => unknown[];
} }).prototype;

function ctxWith(overrides: Partial<Omit<LobbyCtx, "getUserStatus">> = {}): LobbyCtx {
    const ctx = {
        users: {},
        games: {},
        ...overrides
    } as LobbyCtx;
    ctx.getUserStatus = (name: string) => proto.getUserStatus.call(ctx, name);
    return ctx;
}

const getUserStatus = proto.getUserStatus;
const getUserList = proto.getUserList;

describe("Lobby.getUserStatus", () => {
    it("returns 'lobby' when user is not in any game", () => {
        const ctx = ctxWith({ users: { alice: { username: "alice" } } });
        expect(getUserStatus.call(ctx, "alice")).toBe("lobby");
    });

    it("returns 'playing' when user is in game.players (pending or started)", () => {
        const ctx = ctxWith({
            games: {
                g1: { players: { alice: {} }, spectators: {} }
            }
        });
        expect(getUserStatus.call(ctx, "alice")).toBe("playing");
    });

    it("returns 'spectating' when user is in game.spectators", () => {
        const ctx = ctxWith({
            games: {
                g1: { players: {}, spectators: { alice: {} } }
            }
        });
        expect(getUserStatus.call(ctx, "alice")).toBe("spectating");
    });

    it("returns 'lobby' when players[name].left === true", () => {
        const ctx = ctxWith({
            games: {
                g1: { players: { alice: { left: true } }, spectators: {} }
            }
        });
        expect(getUserStatus.call(ctx, "alice")).toBe("lobby");
    });
});

describe("Lobby.getUserList", () => {
    it("includes the status field for every user", () => {
        const ctx = ctxWith({
            users: {
                alice: { username: "alice" },
                bob: { username: "bob" }
            },
            games: {
                g1: { players: { bob: {} }, spectators: {} }
            }
        });
        const list = getUserList.call(ctx) as Array<{ name: string; status: string }>;
        expect(list).toEqual([
            expect.objectContaining({ name: "alice", status: "lobby" }),
            expect.objectContaining({ name: "bob", status: "playing" })
        ]);
    });

    it("sorts case-insensitively by name", () => {
        const ctx = ctxWith({
            users: {
                Bravo: { username: "Bravo" },
                alpha: { username: "alpha" },
                charlie: { username: "charlie" }
            }
        });
        const list = getUserList.call(ctx) as Array<{ name: string }>;
        expect(list.map(u => u.name)).toEqual(["alpha", "Bravo", "charlie"]);
    });
});

type BroadcastCtx = {
    lastUserBroadcast: Date;
    pendingUserBroadcast: ReturnType<typeof setTimeout> | null;
    sendUserListToAll: () => void;
};

const broadcastUserList = (Lobby as unknown as { prototype: { broadcastUserList: (this: BroadcastCtx) => void } }).prototype.broadcastUserList;

describe("Lobby.broadcastUserList (5s debounce)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-22T10:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function makeCtx(): BroadcastCtx & { sendSpy: ReturnType<typeof vi.fn> } {
        const sendSpy = vi.fn();
        return {
            lastUserBroadcast: new Date(0),
            pendingUserBroadcast: null,
            sendUserListToAll: sendSpy,
            sendSpy
        };
    }

    it("broadcasts immediately when more than 5s has elapsed", () => {
        const ctx = makeCtx();
        broadcastUserList.call(ctx);
        expect(ctx.sendSpy).toHaveBeenCalledTimes(1);
    });

    it("defers a second call within the 5s window to a single trailing broadcast", () => {
        const ctx = makeCtx();
        broadcastUserList.call(ctx);
        ctx.lastUserBroadcast = new Date();
        ctx.sendSpy.mockClear();

        vi.advanceTimersByTime(1000);
        broadcastUserList.call(ctx);
        broadcastUserList.call(ctx);
        broadcastUserList.call(ctx);
        expect(ctx.sendSpy).not.toHaveBeenCalled();

        vi.advanceTimersByTime(5000);
        expect(ctx.sendSpy).toHaveBeenCalledTimes(1);
    });

    it("clears the pending flag after the trailing broadcast fires", () => {
        const ctx = makeCtx();
        broadcastUserList.call(ctx);
        ctx.lastUserBroadcast = new Date();
        ctx.sendSpy.mockClear();

        vi.advanceTimersByTime(1000);
        broadcastUserList.call(ctx);
        expect(ctx.pendingUserBroadcast).not.toBeNull();

        vi.advanceTimersByTime(5000);
        expect(ctx.pendingUserBroadcast).toBeNull();
    });
});

// blockList is stripped from the JWT, so the lobby has to load it from the db per connection
type BlockListUser = { username: string; blockList?: string[] };
type BlockListCtx = {
    users: Record<string, BlockListUser>;
    games: Record<string, { owner: BlockListUser }>;
    sockets: Record<string, { user?: BlockListUser }>;
    userService: { getUserByUsername: (name: string) => Promise<{ blockList?: string[] } | null> };
    broadcastGameList: () => void;
    broadcastUserList: () => void;
    ejectBlockedUsers: (name: string, blockList: string[]) => void;
    loadBlockList: (name: string) => Promise<string[]>;
    applyBlockList: (name: string, blockList: string[], socket?: { user?: BlockListUser }) => void;
};

const blockListProto = (Lobby as unknown as { prototype: {
    loadBlockList: (this: BlockListCtx, name: string) => Promise<string[]>;
    applyBlockList: (this: BlockListCtx, name: string, blockList: string[], socket?: { user?: BlockListUser }) => void;
    hydrateBlockList: (this: BlockListCtx, socket: { user?: BlockListUser }) => Promise<void>;
    refreshBlockList: (this: BlockListCtx, name: string) => Promise<void>;
} }).prototype;

function blockListCtx(dbBlockList: string[] | undefined, overrides: Partial<BlockListCtx> = {}): BlockListCtx {
    const ctx = {
        users: {},
        games: {},
        sockets: {},
        userService: { getUserByUsername: vi.fn().mockResolvedValue({ blockList: dbBlockList }) },
        broadcastGameList: vi.fn(),
        broadcastUserList: vi.fn(),
        ejectBlockedUsers: vi.fn(),
        ...overrides
    } as BlockListCtx;
    ctx.loadBlockList = (name: string) => blockListProto.loadBlockList.call(ctx, name);
    ctx.applyBlockList = (name, blockList, socket) => blockListProto.applyBlockList.call(ctx, name, blockList, socket);
    return ctx;
}

describe("Lobby block list hydration", () => {
    it("loads the block list from the db, not from the socket's token", async () => {
        const socket = { user: { username: "alice" } as BlockListUser };
        const ctx = blockListCtx(["bob"], { users: { alice: socket.user } });

        await blockListProto.hydrateBlockList.call(ctx, socket);

        expect(socket.user.blockList).toEqual(["bob"]);
        expect(ctx.users.alice.blockList).toEqual(["bob"]);
    });

    it("defaults to an empty list when the db lookup fails", async () => {
        const socket = { user: { username: "alice" } as BlockListUser };
        const ctx = blockListCtx(undefined, {
            userService: { getUserByUsername: vi.fn().mockRejectedValue(new Error("db down")) }
        });

        await blockListProto.hydrateBlockList.call(ctx, socket);

        expect(socket.user.blockList).toEqual([]);
    });

    it("does nothing for an unauthenticated socket", async () => {
        const ctx = blockListCtx(["bob"]);

        await blockListProto.hydrateBlockList.call(ctx, {});

        expect(ctx.userService.getUserByUsername).not.toHaveBeenCalled();
    });

    it("updates the owner object of games the user already created", () => {
        const owner = { username: "alice" } as BlockListUser;
        const ctx = blockListCtx(["bob"], {
            games: { g1: { owner }, g2: { owner: { username: "charlie" } } }
        });

        blockListProto.applyBlockList.call(ctx, "alice", ["bob"]);

        expect(ctx.games.g1.owner.blockList).toEqual(["bob"]);
        expect(ctx.games.g2.owner.blockList).toBeUndefined();
    });

    it("refreshes every socket of the user and rebroadcasts both lists", async () => {
        const first = { user: { username: "alice" } as BlockListUser };
        const second = { user: { username: "alice" } as BlockListUser };
        const other = { user: { username: "bob" } as BlockListUser };
        const ctx = blockListCtx(["bob"], { sockets: { s1: first, s2: second, s3: other } });

        await blockListProto.refreshBlockList.call(ctx, "alice");

        expect(first.user.blockList).toEqual(["bob"]);
        expect(second.user.blockList).toEqual(["bob"]);
        expect(other.user.blockList).toBeUndefined();
        expect(ctx.broadcastGameList).toHaveBeenCalledTimes(1);
        expect(ctx.broadcastUserList).toHaveBeenCalledTimes(1);
    });

    it("still refreshes stored state when the user has no connected socket", async () => {
        const ctx = blockListCtx(["bob"], { users: { alice: { username: "alice" } } });

        await blockListProto.refreshBlockList.call(ctx, "alice");

        expect(ctx.users.alice.blockList).toEqual(["bob"]);
    });
});

const ejectBlockedUsers = (Lobby as unknown as { prototype: {
    ejectBlockedUsers: (this: EjectCtx, username: string, blockList: string[]) => void;
} }).prototype.ejectBlockedUsers;

type FakeSocket = { sent: Array<[string, unknown]>; left: string[]; send: (m: string, ...a: unknown[]) => void; leaveChannel: (c: string) => void };
type EjectCtx = {
    games: Record<string, PendingGame>;
    sockets: Record<string, FakeSocket>;
    sendGameState: (game: PendingGame) => void;
};

function fakeSocket(): FakeSocket {
    const socket: FakeSocket = {
        sent: [],
        left: [],
        send: (message: string, ...args: unknown[]) => socket.sent.push([message, args[0]]),
        leaveChannel: (channel: string) => socket.left.push(channel)
    };
    return socket;
}

describe("Lobby.ejectBlockedUsers", () => {
    function setup(ownerBlockList: string[], overrides: { started?: boolean } = {}) {
        const game = gameOwnedBy({ username: "alice", blockList: ownerBlockList }, ["alice"]);
        game.players.bob = { id: "bob-socket", name: "bob" };
        game.spectators.charlie = { id: "charlie-socket", name: "charlie" };
        game.started = overrides.started ?? false;

        const sockets = { "bob-socket": fakeSocket(), "charlie-socket": fakeSocket() };
        const ctx = { games: { [game.id]: game }, sockets, sendGameState: vi.fn() } as unknown as EjectCtx;
        return { game, sockets, ctx };
    }

    it("removes a blocked player and tells them why", () => {
        const { game, sockets, ctx } = setup(["bob"]);

        ejectBlockedUsers.call(ctx, "alice", ["bob"]);

        expect(game.players.bob).toBeUndefined();
        expect(sockets["bob-socket"].sent.map(([m]) => m)).toEqual(["cleargamestate", "banner"]);
        expect(sockets["bob-socket"].left).toEqual([game.id]);
        expect(ctx.sendGameState).toHaveBeenCalledWith(game);
    });

    it("removes a blocked spectator too", () => {
        const { game, ctx } = setup(["charlie"]);

        ejectBlockedUsers.call(ctx, "alice", ["charlie"]);

        expect(game.spectators.charlie).toBeUndefined();
        expect(game.players.bob).toBeDefined();
    });

    it("leaves unblocked participants alone", () => {
        const { game, sockets, ctx } = setup(["dave"]);

        ejectBlockedUsers.call(ctx, "alice", ["dave"]);

        expect(game.players.bob).toBeDefined();
        expect(game.spectators.charlie).toBeDefined();
        expect(sockets["bob-socket"].sent).toEqual([]);
    });

    it("never removes the owner, even if they are somehow on their own list", () => {
        const { game, ctx } = setup(["alice"]);

        ejectBlockedUsers.call(ctx, "alice", ["alice"]);

        expect(game.players.alice).toBeDefined();
    });

    it("does not touch a game that has already started", () => {
        const { game, ctx } = setup(["bob"], { started: true });

        ejectBlockedUsers.call(ctx, "alice", ["bob"]);

        expect(game.players.bob).toBeDefined();
        expect(ctx.sendGameState).not.toHaveBeenCalled();
    });

    it("only touches games the blocker owns", () => {
        const game = gameOwnedBy({ username: "charlie", blockList: [] }, ["charlie"]);
        game.players.bob = { id: "bob-socket", name: "bob" };
        const ctx = { games: { [game.id]: game }, sockets: {}, sendGameState: vi.fn() } as unknown as EjectCtx;

        ejectBlockedUsers.call(ctx, "alice", ["bob"]);

        expect(game.players.bob).toBeDefined();
    });

    it("deletes the game when nobody active is left", () => {
        const game = gameOwnedBy({ username: "alice", blockList: ["bob"] }, []);
        game.players.bob = { id: "bob-socket", name: "bob" };
        const ctx = { games: { [game.id]: game }, sockets: {}, sendGameState: vi.fn() } as unknown as EjectCtx;

        ejectBlockedUsers.call(ctx, "alice", ["bob"]);

        expect(ctx.games[game.id]).toBeUndefined();
        expect(ctx.sendGameState).not.toHaveBeenCalled();
    });

    it("does nothing when the block list is empty", () => {
        const { game, ctx } = setup([]);

        ejectBlockedUsers.call(ctx, "alice", []);

        expect(game.players.bob).toBeDefined();
        expect(ctx.sendGameState).not.toHaveBeenCalled();
    });
});

type GameListCtx = { games: Record<string, PendingGame>; canRejoin: (game: PendingGame, username: string) => boolean };

const gameListProto = (Lobby as unknown as { prototype: {
    filterGameListWithBlockList: (this: GameListCtx, user?: { username: string; blockList?: string[] }) => PendingGame[] | Record<string, PendingGame>;
    mapGamesToGameSummaries: (this: GameListCtx, games: PendingGame[] | Record<string, PendingGame>, username?: string) => Array<{ id: string; canRejoin: boolean }>;
    canRejoin: (game: PendingGame, username: string) => boolean;
} }).prototype;
const filterGameListWithBlockList = gameListProto.filterGameListWithBlockList;

function gameListCtx(games: Record<string, PendingGame>): GameListCtx {
    return { games, canRejoin: gameListProto.canRejoin };
}

function gameOwnedBy(owner: { username: string; blockList?: string[] }, playerNames: string[]) {
    const game = new PendingGame(owner, { name: `${owner.username}'s game` });
    playerNames.forEach(name => {
        game.players[name] = { id: name, name: name };
    });
    return game;
}

describe("Lobby.filterGameListWithBlockList", () => {
    it("hides the game from a player the owner has blocked", () => {
        const ctx = gameListCtx({ g1: gameOwnedBy({ username: "alice", blockList: ["bob"] }, ["alice"]) });

        const games = filterGameListWithBlockList.call(ctx, { username: "bob", blockList: [] });

        expect(games).toEqual([]);
    });

    it("hides a game containing someone the viewer has blocked", () => {
        const ctx = gameListCtx({ g1: gameOwnedBy({ username: "alice", blockList: [] }, ["Alice"]) });

        const games = filterGameListWithBlockList.call(ctx, { username: "bob", blockList: ["alice"] });

        expect(games).toEqual([]);
    });

    it("keeps games with no block relationship", () => {
        const ctx = gameListCtx({ g1: gameOwnedBy({ username: "alice", blockList: ["charlie"] }, ["alice"]) });

        const games = filterGameListWithBlockList.call(ctx, { username: "bob", blockList: ["dave"] });

        expect(games).toHaveLength(1);
    });

    it("keeps a started game the viewer left even when the owner blocked them", () => {
        const game = gameOwnedBy({ username: "alice", blockList: ["bob"] }, ["alice", "bob"]);
        game.started = true;
        game.node = { identity: "node-1" };
        game.players.bob.left = true;

        const games = filterGameListWithBlockList.call(gameListCtx({ g1: game }), { username: "bob", blockList: [] });

        expect(games).toEqual([game]);
    });
});

describe("Lobby.mapGamesToGameSummaries", () => {
    it("marks only the viewer's own left seat in a started game as canRejoin", () => {
        const left = gameOwnedBy({ username: "alice" }, ["alice", "bob"]);
        left.started = true;
        left.node = { identity: "node-1" };
        left.players.bob.left = true;
        const playing = gameOwnedBy({ username: "carol" }, ["carol", "dave"]);
        playing.started = true;
        playing.node = { identity: "node-1" };
        const ctx = gameListCtx({ [left.id]: left, [playing.id]: playing });

        const forBob = gameListProto.mapGamesToGameSummaries.call(ctx, ctx.games, "bob");
        const forAlice = gameListProto.mapGamesToGameSummaries.call(ctx, ctx.games, "alice");
        const anonymous = gameListProto.mapGamesToGameSummaries.call(ctx, ctx.games);

        expect(forBob.find(game => game.id === left.id)?.canRejoin).toBe(true);
        expect(forBob.find(game => game.id === playing.id)?.canRejoin).toBe(false);
        expect(forAlice.every(game => !game.canRejoin)).toBe(true);
        expect(anonymous.every(game => !game.canRejoin)).toBe(true);
    });

    it("doesn't offer a rejoin before the game started or without a node", () => {
        const notStarted = gameOwnedBy({ username: "alice" }, ["alice", "bob"]);
        notStarted.players.bob.left = true;
        const noNode = gameOwnedBy({ username: "alice" }, ["alice", "bob"]);
        noNode.started = true;
        noNode.players.bob.left = true;
        const ctx = gameListCtx({ [notStarted.id]: notStarted, [noNode.id]: noNode });

        const forBob = gameListProto.mapGamesToGameSummaries.call(ctx, ctx.games, "bob");

        expect(forBob.every(game => !game.canRejoin)).toBe(true);
    });
});

describe("PendingGame block list gates", () => {
    it("rejects a join from a blocked user with a message", () => {
        const game = gameOwnedBy({ username: "alice", blockList: ["bob"] }, ["alice"]);
        const callback = vi.fn();

        game.join("bob-socket", { username: "bob" }, undefined, callback);

        expect(callback).toHaveBeenCalledWith(expect.any(Error), "You have been blocked by the owner of this game");
        expect(game.players.bob).toBeUndefined();
    });

    it("rejects a spectate from a blocked user with a message", () => {
        const game = gameOwnedBy({ username: "alice", blockList: ["bob"] }, ["alice"]);
        const callback = vi.fn();

        game.watch("bob-socket", { username: "bob" }, undefined, callback);

        expect(callback).toHaveBeenCalledWith(expect.any(Error), "You have been blocked by the owner of this game");
        expect(game.spectators.bob).toBeUndefined();
    });

    it("lets an unblocked user join", () => {
        const game = gameOwnedBy({ username: "alice", blockList: ["charlie"] }, ["alice"]);
        const callback = vi.fn();

        game.join("bob-socket", { username: "bob" }, undefined, callback);

        expect(callback).toHaveBeenCalledWith();
        expect(game.players.bob).toBeDefined();
    });
});

type NodeReconnectedCtx = {
    games: Record<string, PendingGame>;
    router: { workers: Record<string, { identity: string }> };
    broadcastGameList: () => void;
};

const onNodeReconnected = (Lobby as unknown as { prototype: {
    onNodeReconnected: (this: NodeReconnectedCtx, nodeName: string, games: unknown[]) => void;
} }).prototype.onNodeReconnected;

function nodeGame(overrides: Record<string, unknown> = {}) {
    return {
        id: "g1",
        name: "Game",
        owner: "alice",
        players: { bob: { id: "b", name: "bob", faction: "crab", owner: false, deck: {} } },
        spectators: [],
        allowSpectators: true,
        manualMode: false,
        started: true,
        createdAt: "2026-11-05T09:59:00Z",
        startedAt: "2026-11-05T10:00:00Z",
        gameType: "casual",
        gameMode: "emerald",
        ...overrides
    };
}

describe("Lobby.onNodeReconnected", () => {
    it("rebuilds an unknown game with its game mode and spectators", () => {
        const ctx: NodeReconnectedCtx = {
            games: {},
            router: { workers: { "node-1": { identity: "node-1" } } },
            broadcastGameList: vi.fn()
        };

        onNodeReconnected.call(ctx, "node-1", [nodeGame({ gameMode: "skirmish", spectators: [{ id: "c", name: "carol" }] })]);

        const game = ctx.games.g1;
        expect(game.gameMode).toBe("skirmish");
        expect(game.skirmishMode).toBe(true);
        expect(game.spectators.carol).toEqual({ id: "c", name: "carol" });
    });

    it("keeps the lobby's record of a known game and only refreshes its node", () => {
        const known = new PendingGame({ username: "alice" }, { name: "Game", gameMode: "emerald", spectatorSquelch: true });
        known.id = "g1";
        known.started = true;
        known.players.alice = { id: "a", name: "alice", owner: true, user: { username: "alice" } };
        known.players.bob = { id: "b", name: "bob", user: { username: "bob" } };
        known.node = { identity: "node-1" };
        const ctx: NodeReconnectedCtx = {
            games: { g1: known },
            router: { workers: { "node-1": { identity: "node-1" } } },
            broadcastGameList: vi.fn()
        };

        onNodeReconnected.call(ctx, "node-1", [nodeGame({ gameMode: undefined })]);

        expect(ctx.games.g1).toBe(known);
        expect(known.node).toBe(ctx.router.workers["node-1"]);
        expect(known.gameMode).toBe("emerald");
        expect(known.spectatorSquelch).toBe(true);
        expect(known.players.alice.user).toEqual({ username: "alice" });
    });

    it("removes the node's games that it no longer runs", () => {
        const gone = new PendingGame({ username: "alice" }, { name: "Gone" });
        gone.id = "g2";
        gone.node = { identity: "node-1" };
        const otherNode = new PendingGame({ username: "dave" }, { name: "Elsewhere" });
        otherNode.id = "g3";
        otherNode.node = { identity: "node-2" };
        const ctx: NodeReconnectedCtx = {
            games: { g2: gone, g3: otherNode },
            router: { workers: { "node-1": { identity: "node-1" } } },
            broadcastGameList: vi.fn()
        };

        onNodeReconnected.call(ctx, "node-1", [nodeGame()]);

        expect(Object.keys(ctx.games).sort()).toEqual(["g1", "g3"]);
    });

    it("keeps a game whose owner has left (the node no longer lists the owner as a player)", () => {
        const ctx: NodeReconnectedCtx = {
            games: {},
            router: { workers: { "node-1": { identity: "node-1" } } },
            broadcastGameList: vi.fn()
        };

        onNodeReconnected.call(ctx, "node-1", [nodeGame()]);

        const game = ctx.games.g1;
        expect(game).toBeDefined();
        expect(game.node).toBe(ctx.router.workers["node-1"]);
        expect(game.started).toBe(true);
        expect(Object.keys(game.players)).toEqual(["bob"]);
        expect(game.players.bob.owner).toBe(false);
        expect(ctx.broadcastGameList).toHaveBeenCalled();
    });

    it("keeps a player who left as a left seat, so they can rejoin after a lobby restart", () => {
        const ctx: NodeReconnectedCtx = {
            games: {},
            router: { workers: { "node-1": { identity: "node-1" } } },
            broadcastGameList: vi.fn()
        };

        onNodeReconnected.call(ctx, "node-1", [nodeGame({ players: {
            alice: { id: "a", name: "alice", faction: "crane", owner: true, deck: {}, left: true },
            bob: { id: "b", name: "bob", faction: "crab", owner: false, deck: {} }
        } })]);

        const game = ctx.games.g1;
        expect(game.players.alice.left).toBe(true);
        expect(game.players.bob.left).toBeFalsy();
        expect(gameListProto.canRejoin(game, "alice")).toBe(true);
        expect(gameListProto.canRejoin(game, "bob")).toBe(false);
        expect(Object.keys(game.getSummary().players)).toEqual(["bob"]);
    });
});

type StartGameCtx = {
    games: Record<string, PendingGame>;
    router: { startGame: ReturnType<typeof vi.fn> };
    io: { to: ReturnType<typeof vi.fn>; sockets?: { adapter: { rooms: Map<string, Set<string>> } } };
    sockets?: Record<string, { user: { username: string }; send: ReturnType<typeof vi.fn> }>;
    handoffToken?: (socket: { user?: { username: string } }) => string | undefined;
    broadcastGameList: ReturnType<typeof vi.fn>;
};

const onStartGame = (Lobby as unknown as { prototype: {
    onStartGame: (this: StartGameCtx, socket: { user: { username: string } }, gameId: string) => void;
} }).prototype.onStartGame;

describe("Lobby.onStartGame", () => {
    it("tells the players when no game server takes the game", () => {
        const game = new PendingGame({ username: "alice" }, { name: "Game" });
        game.players.alice = { id: "a", name: "alice", owner: true, deck: {} };
        const emit = vi.fn();
        const ctx: StartGameCtx = {
            games: { [game.id]: game },
            router: { startGame: vi.fn(() => undefined) },
            io: { to: vi.fn(() => ({ emit })) },
            broadcastGameList: vi.fn()
        };

        onStartGame.call(ctx, { user: { username: "alice" } }, game.id);

        expect(ctx.io.to).toHaveBeenCalledWith(game.id);
        expect(emit).toHaveBeenCalledExactlyOnceWith("nogameserver");
        expect(game.started).toBe(false);
        expect(ctx.broadcastGameList).not.toHaveBeenCalled();
    });

    it("hands each socket in the game off with its own token", () => {
        const game = new PendingGame({ username: "alice" }, { name: "Game" });
        game.players.alice = { id: "a", name: "alice", owner: true, deck: {} };
        game.players.bob = { id: "b", name: "bob", deck: {} };
        const node = { identity: "node-1", address: "host", port: 9500, protocol: "https" };
        const alice = { user: { username: "alice" }, send: vi.fn() };
        const bob = { user: { username: "bob" }, send: vi.fn() };
        const ctx: StartGameCtx = {
            games: { [game.id]: game },
            router: { startGame: vi.fn(() => node) },
            io: { to: vi.fn(), sockets: { adapter: { rooms: new Map([[game.id, new Set(["sa", "sb"])]]) } } },
            sockets: { sa: alice, sb: bob },
            handoffToken: (socket) => `token-${socket.user?.username}`,
            broadcastGameList: vi.fn()
        };

        onStartGame.call(ctx, { user: { username: "alice" } }, game.id);

        expect(alice.send).toHaveBeenCalledExactlyOnceWith("handoff", { address: "host", port: 9500, protocol: "https", name: "node-1", token: "token-alice" });
        expect(bob.send).toHaveBeenCalledExactlyOnceWith("handoff", { address: "host", port: 9500, protocol: "https", name: "node-1", token: "token-bob" });
    });
});

const handoffToken = (Lobby as unknown as { prototype: {
    handoffToken: (this: { config: { secret: string } }, socket: { user?: Record<string, unknown> & { username: string } }) => string | undefined;
} }).prototype.handoffToken;

describe("Lobby.handoffToken", () => {
    it("signs the socket's user afresh for 5h, without the block list or the old token's times", () => {
        const now = Math.floor(Date.now() / 1000);
        const token = handoffToken.call({ config: { secret: "s" } }, {
            user: { username: "alice", emailHash: "ha", blockList: ["bob"], iat: now - 7200, exp: now - 3600 }
        });

        const payload = jwt.verify(token as string, "s") as jwt.JwtPayload;
        expect(payload.username).toBe("alice");
        expect(payload.emailHash).toBe("ha");
        expect(payload.blockList).toBeUndefined();
        expect(payload.exp! - payload.iat!).toBe(5 * 60 * 60);
    });

    it("gives no token to a socket without a user", () => {
        expect(handoffToken.call({ config: { secret: "s" } }, {})).toBeUndefined();
    });
});

type WatchGameCtx = {
    games: Record<string, PendingGame>;
    router: { addSpectator: ReturnType<typeof vi.fn> };
    findGameForUser: (username: string) => PendingGame | undefined;
    sendGameState: ReturnType<typeof vi.fn>;
    broadcastGameList: ReturnType<typeof vi.fn>;
    broadcastUserList: ReturnType<typeof vi.fn>;
    rejoinGame: (...args: unknown[]) => void;
    canRejoin: (game: PendingGame, username: string) => boolean;
    handoffToken: (socket: WatchSocket) => string;
};

type WatchSocket = { user: { username: string }; joinChannel: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn> };

const lobbyProto = (Lobby as unknown as { prototype: {
    onWatchGame: (this: WatchGameCtx, socket: WatchSocket, gameId: string, password?: string) => void;
    findGameForUser: (this: WatchGameCtx, username: string) => PendingGame | undefined;
    rejoinGame: (this: WatchGameCtx, ...args: unknown[]) => void;
} }).prototype;

describe("Lobby.onWatchGame", () => {
    function startedGame(allowSpectators: boolean) {
        const game = new PendingGame({ username: "alice" }, { name: "Game", spectators: allowSpectators });
        game.started = true;
        game.node = { identity: "node-1", address: "host", port: 9500, protocol: "https" };
        game.players.alice = { id: "a", name: "alice", owner: true, emailHash: "ha" };
        game.players.bob = { id: "b", name: "bob", emailHash: "hb" };
        return game;
    }

    function makeCtx(game: PendingGame): WatchGameCtx {
        const ctx: WatchGameCtx = {
            games: { [game.id]: game },
            router: { addSpectator: vi.fn() },
            findGameForUser: (username: string) => lobbyProto.findGameForUser.call(ctx, username),
            sendGameState: vi.fn(),
            broadcastGameList: vi.fn(),
            broadcastUserList: vi.fn(),
            rejoinGame: (...args: unknown[]) => lobbyProto.rejoinGame.call(ctx, ...args),
            canRejoin: gameListProto.canRejoin,
            handoffToken: (socket: WatchSocket) => `token-${socket.user.username}`
        };
        return ctx;
    }

    function makeSocket(username: string): WatchSocket {
        return { user: { username }, joinChannel: vi.fn(), send: vi.fn() };
    }

    it("takes a player who left a started game back to their seat, without spectator, password or block checks", () => {
        const game = startedGame(false);
        game.password = "hashed";
        game.owner.blockList = ["alice"];
        game.players.alice.left = true;
        const ctx = makeCtx(game);
        const socket = makeSocket("alice");

        lobbyProto.onWatchGame.call(ctx, socket, game.id);

        expect(game.players.alice.left).toBe(false);
        expect(game.spectators.alice).toBeUndefined();
        expect(ctx.findGameForUser("alice")).toBe(game);
        expect(socket.joinChannel).toHaveBeenCalledWith(game.id);
        expect(ctx.router.addSpectator).toHaveBeenCalledExactlyOnceWith(game, { username: "alice", emailHash: "ha" });
        expect(socket.send).toHaveBeenCalledExactlyOnceWith("handoff", { address: "host", port: 9500, protocol: "https", name: "node-1", gameId: game.id, token: "token-alice" });
        expect(ctx.broadcastGameList).toHaveBeenCalled();
    });

    it("still adds anyone else as a spectator", () => {
        const game = startedGame(true);
        const ctx = makeCtx(game);
        const socket = makeSocket("carol");

        lobbyProto.onWatchGame.call(ctx, socket, game.id);

        expect(game.spectators.carol).toBeDefined();
        expect(ctx.router.addSpectator).toHaveBeenCalledWith(game, { username: "carol" });
        expect(socket.send).toHaveBeenCalledWith("handoff", { address: "host", port: 9500, protocol: "https", name: "node-1", token: "token-carol" });
    });

    it("doesn't let a player who left watch a game that doesn't allow spectators before it started", () => {
        const game = startedGame(false);
        game.started = false;
        game.players.alice.left = true;
        const ctx = makeCtx(game);
        const socket = makeSocket("alice");

        lobbyProto.onWatchGame.call(ctx, socket, game.id);

        expect(game.players.alice.left).toBe(true);
        expect(ctx.router.addSpectator).not.toHaveBeenCalled();
        expect(socket.send).not.toHaveBeenCalledWith("handoff", expect.anything());
    });
});
