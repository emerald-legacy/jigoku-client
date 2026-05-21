import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

async function loadBootstrap() {
    vi.resetModules();
    return (await import("../../client/bootstrap")).default;
}

describe("bootstrap (data-bootstrap div reader)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("returns an empty object when no bootstrap div is present (e.g. on an SSR error page)", async () => {
        const bootstrap = await loadBootstrap();
        expect(bootstrap).toEqual({});
    });

    it("returns an empty object when the data attribute is missing", async () => {
        document.body.innerHTML = "<div id=\"bootstrap\"></div>";
        const bootstrap = await loadBootstrap();
        expect(bootstrap).toEqual({});
    });

    it("parses the JSON payload from data-bootstrap into the user/token/cardImageVersion shape", async () => {
        document.body.innerHTML = "<div id=\"bootstrap\"></div>";
        const el = document.getElementById("bootstrap") as HTMLElement;
        el.dataset.bootstrap = JSON.stringify({
            user: { username: "ada", admin: true },
            token: "jwt-1",
            cardImageVersion: "v9"
        });
        const bootstrap = await loadBootstrap();
        expect(bootstrap).toEqual({
            user: { username: "ada", admin: true },
            token: "jwt-1",
            cardImageVersion: "v9"
        });
    });

    it("returns an empty object when the data attribute is malformed JSON (does not crash the app)", async () => {
        document.body.innerHTML = "<div id=\"bootstrap\"></div>";
        const el = document.getElementById("bootstrap") as HTMLElement;
        el.dataset.bootstrap = "{not json";
        const bootstrap = await loadBootstrap();
        expect(bootstrap).toEqual({});
    });
});
