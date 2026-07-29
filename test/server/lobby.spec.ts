// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

const filterGameListWithBlockList = (Lobby as unknown as { prototype: {
    filterGameListWithBlockList: (this: { games: Record<string, PendingGame> }, user?: { username: string; blockList?: string[] }) => PendingGame[] | Record<string, PendingGame>;
} }).prototype.filterGameListWithBlockList;

function gameOwnedBy(owner: { username: string; blockList?: string[] }, playerNames: string[]) {
    const game = new PendingGame(owner, { name: `${owner.username}'s game` });
    playerNames.forEach(name => {
        game.players[name] = { id: name, name: name };
    });
    return game;
}

describe("Lobby.filterGameListWithBlockList", () => {
    it("hides the game from a player the owner has blocked", () => {
        const ctx = { games: { g1: gameOwnedBy({ username: "alice", blockList: ["bob"] }, ["alice"]) } };

        const games = filterGameListWithBlockList.call(ctx, { username: "bob", blockList: [] });

        expect(games).toEqual([]);
    });

    it("hides a game containing someone the viewer has blocked", () => {
        const ctx = { games: { g1: gameOwnedBy({ username: "alice", blockList: [] }, ["Alice"]) } };

        const games = filterGameListWithBlockList.call(ctx, { username: "bob", blockList: ["alice"] });

        expect(games).toEqual([]);
    });

    it("keeps games with no block relationship", () => {
        const ctx = { games: { g1: gameOwnedBy({ username: "alice", blockList: ["charlie"] }, ["alice"]) } };

        const games = filterGameListWithBlockList.call(ctx, { username: "bob", blockList: ["dave"] });

        expect(games).toHaveLength(1);
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
