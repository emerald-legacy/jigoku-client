import { describe, it, expect, vi } from "vitest";

vi.mock("../../client/assetUrl", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../client/assetUrl")>();
    return {
        ...actual,
        promoArt: (stem: string) => (stem === "hida-honoka-emerald-core-set" ? "/assets/hida-honoka.abc123.webp" : undefined)
    };
});

import { getCardImageUrl } from "../../client/cardImageUrl";

describe("getCardImageUrl", () => {
    it("returns the standard art path from id + packId", () => {
        expect(getCardImageUrl("hida-honoka", "emerald-core-set")).toContain("/img/cards/hida-honoka-emerald-core-set.jpg");
    });

    it("returns the standard art path from id alone when no packId", () => {
        expect(getCardImageUrl("hida-honoka")).toContain("/img/cards/hida-honoka.jpg");
    });

    it("returns an empty string for a missing cardId", () => {
        expect(getCardImageUrl("")).toBe("");
    });

    it("returns the promo URL when showPromo is set and a promo exists", () => {
        expect(getCardImageUrl("hida-honoka", "emerald-core-set", true)).toBe("/assets/hida-honoka.abc123.webp");
    });

    it("falls through to standard art when showPromo is set but no promo exists", () => {
        expect(getCardImageUrl("hida-kisada", "emerald-core-set", true)).toContain("/img/cards/hida-kisada-emerald-core-set.jpg");
    });

    it("ignores promos when showPromo is not set, even if one exists", () => {
        expect(getCardImageUrl("hida-honoka", "emerald-core-set", false)).toContain("/img/cards/hida-honoka-emerald-core-set.jpg");
    });
});
