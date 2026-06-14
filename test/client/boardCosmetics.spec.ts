import { describe, it, expect } from "vitest";
import { normalizePatronSettings, defaultPatronSettings } from "../../client/boardCosmetics";

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
