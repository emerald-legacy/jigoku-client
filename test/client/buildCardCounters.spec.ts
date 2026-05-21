import { describe, it, expect } from "vitest";
import { buildCardCounters } from "../../client/GameComponents/buildCardCounters";

describe("buildCardCounters", () => {
    it("omits all counters for a card with no fate, honor, status, or tokens", () => {
        const result = buildCardCounters({ uuid: "u", name: "N", type: "character" } as any);
        expect(result).toEqual({});
    });

    it("emits a fate counter with shortName 'F' when the card has fate", () => {
        const result = buildCardCounters({ uuid: "u", name: "N", type: "character", fate: 3 } as any);
        expect(result["card-fate"]).toEqual({ count: 3, fade: false, shortName: "F" });
    });

    it("fades fate counters on attachments", () => {
        const result = buildCardCounters({ uuid: "u", type: "attachment", fate: 2 } as any);
        expect(result["card-fate"]?.fade).toBe(true);
    });

    describe("status-flag prime encoding", () => {
        it("encodes honored as 2", () => {
            const result = buildCardCounters({ uuid: "u", type: "character", isHonored: true } as any);
            expect(result["card-status"]?.count).toBe(2);
        });

        it("encodes dishonored as 3", () => {
            const result = buildCardCounters({ uuid: "u", type: "character", isDishonored: true } as any);
            expect(result["card-status"]?.count).toBe(3);
        });

        it("encodes tainted as 5", () => {
            const result = buildCardCounters({ uuid: "u", type: "character", isTainted: true } as any);
            expect(result["card-status"]?.count).toBe(5);
        });

        it("multiplies factors for combined states (honored + tainted = 10)", () => {
            const result = buildCardCounters({ uuid: "u", type: "character", isHonored: true, isTainted: true } as any);
            expect(result["card-status"]?.count).toBe(10);
        });

        it("omits card-status when no status flag is set (statusFlag === 1)", () => {
            const result = buildCardCounters({ uuid: "u", type: "character" } as any);
            expect(result).not.toHaveProperty("card-status");
        });
    });

    it("emits an honor token counter (the only engine-defined token type) without a shortName, since HonorCounter renders it directly", () => {
        const result = buildCardCounters({ uuid: "u", type: "character", tokens: { honor: 1 } } as any);
        expect(result.honor).toEqual({ count: 1, fade: false });
    });

    it("merges attachment counters into the parent's counter map (fade flag carries the attachment origin)", () => {
        const result = buildCardCounters({
            uuid: "u",
            type: "character",
            fate: 1,
            attachments: [{ uuid: "a", type: "attachment", tokens: { honor: 2 } } as any]
        } as any);
        expect(result["card-fate"]?.count).toBe(1);
        expect(result.honor).toEqual({ count: 2, fade: true });
    });
});
