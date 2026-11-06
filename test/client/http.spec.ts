import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpError, onHttpErrorStatus } from "../../client/http";

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("http", () => {
    const fetchSpy = vi.fn();

    beforeEach(() => {
        fetchSpy.mockReset();
        vi.stubGlobal("fetch", fetchSpy);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a JSON body with a JSON Content-Type and returns the parsed response", async () => {
        fetchSpy.mockResolvedValue(jsonResponse({ success: true, id: 7 }));
        const response = await http.post("/api/things", { name: "Kaiu" });
        const [url, init] = fetchSpy.mock.calls[0];
        expect(url).toBe("/api/things");
        expect(init.method).toBe("POST");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(init.body).toBe(JSON.stringify({ name: "Kaiu" }));
        expect(response).toEqual({ data: { success: true, id: 7 }, status: 200 });
    });

    it("sends no body or Content-Type when none is given", async () => {
        fetchSpy.mockResolvedValue(new Response("", { status: 200 }));
        const response = await http.post("/api/account/logout");
        const [, init] = fetchSpy.mock.calls[0];
        expect(init.body).toBeUndefined();
        expect(init.headers["Content-Type"]).toBeUndefined();
        expect(response.data).toBe("");
    });

    it("appends query params to GET requests", async () => {
        fetchSpy.mockResolvedValue(jsonResponse({}));
        await http.get("/api/news/", { params: { limit: 5 } });
        expect(fetchSpy.mock.calls[0][0]).toBe("/api/news/?limit=5");
    });

    it("rejects non-2xx responses with an HttpError carrying status and body", async () => {
        fetchSpy.mockResolvedValue(jsonResponse({ message: "nope" }, 500));
        const error = await http.get("/api/fail").catch((e: unknown) => e);
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(500);
        expect((error as HttpError).data).toEqual({ message: "nope" });
    });

    it("notifies registered handlers of error statuses until removed", async () => {
        const handler = vi.fn();
        const remove = onHttpErrorStatus(handler);
        fetchSpy.mockResolvedValue(jsonResponse({}, 401));
        await expect(http.get("/api/secret")).rejects.toBeInstanceOf(HttpError);
        expect(handler).toHaveBeenCalledExactlyOnceWith(401);

        remove();
        fetchSpy.mockResolvedValue(jsonResponse({}, 401));
        await expect(http.get("/api/secret")).rejects.toBeInstanceOf(HttpError);
        expect(handler).toHaveBeenCalledOnce();
    });

    it("does not notify handlers on success or network failure", async () => {
        const handler = vi.fn();
        const remove = onHttpErrorStatus(handler);
        fetchSpy.mockResolvedValueOnce(jsonResponse({}));
        await http.get("/api/ok");
        fetchSpy.mockRejectedValueOnce(new TypeError("Failed to fetch"));
        await expect(http.get("/api/down")).rejects.toBeInstanceOf(TypeError);
        expect(handler).not.toHaveBeenCalled();
        remove();
    });
});
