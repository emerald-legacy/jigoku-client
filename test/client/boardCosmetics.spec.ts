import { describe, it, expect } from "vitest";
import {
    normalizePatronSettings,
    defaultPatronSettings,
    normalizeRingsValue,
    resolveRingSet,
    defaultViewerConfig,
    type PatronViewerConfig
} from "../../client/boardCosmetics";

describe("normalizePatronSettings — usePromos", () => {
    it("defaults usePromos to false when unset", () => {
        expect(normalizePatronSettings(undefined).usePromos).toBe(false);
        expect(defaultPatronSettings.usePromos).toBe(false);
    });

    it("preserves a true usePromos flag", () => {
        expect(normalizePatronSettings({ usePromos: true }).usePromos).toBe(true);
    });

    it("coerces a non-boolean usePromos value to false", () => {
        expect(normalizePatronSettings({ usePromos: "yes" }).usePromos).toBe(false);
        expect(normalizePatronSettings({ usePromos: 1 }).usePromos).toBe(false);
    });
});

describe("normalizeRingsValue", () => {
    it("defaults to 'default' for unset/unknown/legacy boolean values", () => {
        expect(normalizeRingsValue(undefined)).toBe("default");
        expect(normalizeRingsValue(true)).toBe("default");
        expect(normalizeRingsValue(false)).toBe("default");
        expect(normalizeRingsValue("bogus")).toBe("default");
    });

    it("preserves a valid ring set id", () => {
        expect(normalizeRingsValue("gold")).toBe("gold");
        expect(normalizeRingsValue("etched")).toBe("etched");
    });
});

describe("resolveRingSet", () => {
    const viewer = (over: Partial<PatronViewerConfig>): PatronViewerConfig => ({ ...defaultViewerConfig, ...over });
    const base = {
        isPatronByUsername: { alice: true, bob: true },
        ringSetByUsername: { alice: "gold", bob: "nacre", carol: "wood" },
        playerUsernames: ["alice", "bob"],
        creatorUsername: "alice",
        viewerUsername: "bob"
    };

    it("patron player sees their own set (patron vs patron)", () => {
        expect(resolveRingSet({ ...base, viewer: viewer({ isPatron: true, rings: "nacre" }) })).toBe("nacre");
    });

    it("non-patron player sees their patron opponent's set", () => {
        // viewer = bob's seat but non-patron; opponent alice is a patron with gold
        expect(resolveRingSet({ ...base, viewer: viewer({ isPatron: false }) })).toBe("gold");
    });

    it("non-patron player sees default when the opponent is not a patron", () => {
        expect(resolveRingSet({
            ...base,
            isPatronByUsername: { bob: false, alice: false },
            viewer: viewer({ isPatron: false })
        })).toBe("default");
    });

    it("spectator sees the game creator's set", () => {
        expect(resolveRingSet({ ...base, viewer: viewer({ isPatron: true, rings: "wood", spectating: true }) })).toBe("gold");
    });

    it("spectator sees default when the creator is not a patron", () => {
        expect(resolveRingSet({
            ...base,
            isPatronByUsername: { alice: false, bob: true },
            viewer: viewer({ spectating: true })
        })).toBe("default");
    });
});
