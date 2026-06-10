import { describe, it, expect } from "vitest";

import { promoArt } from "../../client/assetUrl";

describe("promoArt", () => {
    it("resolves a known promo by its <cardId>-<packId> stem", () => {
        const url = promoArt("hida-honoka-emerald-core-set");
        expect(url).toBeTruthy();
        expect(url).toMatch(/\.webp/);
    });

    it("resolves every promo file under the set directory", () => {
        for(const stem of [
            "akodo-yoshitsune-emerald-core-set",
            "daidoji-ota-emerald-core-set",
            "hida-honoka-emerald-core-set",
            "ide-nobutada-emerald-core-set",
            "isawa-hifumi-emerald-core-set",
            "mirumoto-hitori-emerald-core-set",
            "shinjo-takame-emerald-core-set",
            "soshi-yuka-emerald-core-set"
        ]) {
            expect(promoArt(stem), stem).toBeTruthy();
        }
    });

    it("returns undefined for an unknown stem", () => {
        expect(promoArt("no-such-card-no-such-pack")).toBeUndefined();
    });

    it("keys by the bare filename stem, not the full path or set dir", () => {
        expect(promoArt("emerald-core-set/hida-honoka-emerald-core-set")).toBeUndefined();
        expect(promoArt("hida-honoka")).toBeUndefined();
    });
});
