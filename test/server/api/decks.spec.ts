// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

const getById = vi.fn();
const update = vi.fn();

vi.mock("../../../server/db.js", () => ({ default: { getDb: () => ({}) } }));
vi.mock("../../../server/services/DeckService.js", () => ({
    default: class {
        getById = getById;
        update = update;
    }
}));
vi.mock("../../../server/services/DeckStatsService.js", () => ({
    default: class {
        upsertForDeck = vi.fn();
    }
}));

import { init } from "../../../server/api/decks.js";

type Handler = (req: unknown, res: unknown, next: (err?: unknown) => void) => Promise<unknown>;

function putDeckHandler(): Handler {
    const routes: Record<string, Handler> = {};
    const register = (route: string, handler: Handler) => {
        routes[route] = handler;
    };
    init({ get: vi.fn(), post: vi.fn(), delete: vi.fn(), put: register });
    return routes["/api/decks/:id"];
}

describe("PUT /api/decks/:id", () => {
    it("updates the deck in the URL, whose owner was checked, even when the posted data names another id", async () => {
        getById.mockResolvedValue({ username: "alice" });
        update.mockResolvedValue({ matchedCount: 1 });
        const res = { status: vi.fn(), send: vi.fn() };
        res.status.mockReturnValue(res);

        await putDeckHandler()({
            params: { id: "aaaaaaaaaaaaaaaaaaaaaaaa" },
            user: { username: "alice" },
            body: { data: JSON.stringify({ id: "bbbbbbbbbbbbbbbbbbbbbbbb", deckName: "Mine" }) }
        }, res, () => {});

        expect(getById).toHaveBeenCalledWith("aaaaaaaaaaaaaaaaaaaaaaaa");
        expect(update).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: "aaaaaaaaaaaaaaaaaaaaaaaa", deckName: "Mine" }));
    });
});
