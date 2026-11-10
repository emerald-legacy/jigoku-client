// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getAllCards = vi.fn();

vi.mock("../../../server/db.js", () => ({ default: { getDb: () => ({}) } }));
vi.mock("../../../server/services/CardService.js", () => ({
    default: class {
        getAllCards = getAllCards;
    }
}));

import { init } from "../../../server/api/cards.js";

type Handler = (req: unknown, res: FakeResponse, next: (err?: unknown) => void) => Promise<unknown>;

interface FakeResponse {
    body?: string;
    contentType?: string;
    type: (t: string) => FakeResponse;
    send: (body: string) => FakeResponse;
}

function fakeResponse(): FakeResponse {
    const res: FakeResponse = {
        type(t) {
            res.contentType = t;
            return res;
        },
        send(body) {
            res.body = body;
            return res;
        }
    };
    return res;
}

function cardsHandler(): Handler {
    const routes: Record<string, Handler> = {};
    init({ get: (route: string, handler: Handler) => {
        routes[route] = handler;
    } });
    return routes["/api/cards"];
}

async function request(handler: Handler) {
    const res = fakeResponse();
    await handler({}, res, () => {});
    return res;
}

describe("GET /api/cards", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        getAllCards.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("sends the short-form card list as JSON", async () => {
        getAllCards.mockResolvedValue({ "hida-kisada": { id: "hida-kisada" } });
        const res = await request(cardsHandler());

        expect(getAllCards).toHaveBeenCalledWith({ shortForm: true });
        expect(res.contentType).toBe("json");
        expect(JSON.parse(res.body ?? "")).toEqual({ success: true, cards: { "hida-kisada": { id: "hida-kisada" } } });
    });

    it("reads the cards from the database only once within five minutes", async () => {
        getAllCards.mockResolvedValue({});
        const handler = cardsHandler();

        await request(handler);
        vi.advanceTimersByTime(4 * 60 * 1000);
        await request(handler);
        expect(getAllCards).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(2 * 60 * 1000);
        await request(handler);
        expect(getAllCards).toHaveBeenCalledTimes(2);
    });

    it("does not cache a failed read", async () => {
        getAllCards.mockResolvedValueOnce(undefined).mockResolvedValueOnce({});
        const handler = cardsHandler();

        expect(JSON.parse((await request(handler)).body ?? "")).toEqual({ success: true });
        await request(handler);
        expect(getAllCards).toHaveBeenCalledTimes(2);
    });
});
