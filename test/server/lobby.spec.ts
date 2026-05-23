// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import Lobby from "../../server/lobby.js";

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
