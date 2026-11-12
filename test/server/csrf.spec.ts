// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import type express from "express";

import { rejectCrossSiteWrites } from "../../server/csrf.js";

function run(method: string, headers: Record<string, string>) {
    const lower = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
    const req = { method, get: (name: string) => lower[name.toLowerCase()] } as unknown as express.Request;
    const res = { status: vi.fn(), send: vi.fn() };
    res.status.mockReturnValue(res);
    const next = vi.fn();

    rejectCrossSiteWrites(req, res as unknown as express.Response, next);

    return { passed: next.mock.calls.length === 1, status: res.status.mock.calls[0]?.[0] };
}

describe("rejectCrossSiteWrites", () => {
    it("lets reads through, even from another site", () => {
        expect(run("GET", { "Sec-Fetch-Site": "cross-site" }).passed).toBe(true);
    });

    it("lets same-origin writes through", () => {
        expect(run("POST", { "Sec-Fetch-Site": "same-origin", Host: "jigoku.online" }).passed).toBe(true);
    });

    it("lets user-initiated requests through", () => {
        expect(run("POST", { "Sec-Fetch-Site": "none" }).passed).toBe(true);
    });

    it("rejects writes from another site or a subdomain", () => {
        expect(run("POST", { "Sec-Fetch-Site": "cross-site" })).toEqual({ passed: false, status: 403 });
        expect(run("DELETE", { "Sec-Fetch-Site": "same-site" })).toEqual({ passed: false, status: 403 });
    });

    it("falls back to Origin against Host without Sec-Fetch-Site", () => {
        expect(run("PUT", { Origin: "https://jigoku.online", Host: "jigoku.online" }).passed).toBe(true);
        expect(run("PUT", { Origin: "http://localhost:4000", Host: "localhost:4000" }).passed).toBe(true);
        expect(run("PUT", { Origin: "https://evil.example", Host: "jigoku.online" })).toEqual({ passed: false, status: 403 });
        expect(run("PUT", { Origin: "null", Host: "jigoku.online" })).toEqual({ passed: false, status: 403 });
    });

    it("lets requests without either header through: they don't come from a browser page", () => {
        expect(run("POST", { Host: "jigoku.online" }).passed).toBe(true);
    });
});
