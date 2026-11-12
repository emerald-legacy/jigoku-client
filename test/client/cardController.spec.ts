import { describe, it, expect } from "vitest";

import { controllerName } from "../../client/cardController";

describe("controllerName", () => {
    it("returns the name the game server sends", () => {
        expect(controllerName("alice")).toBe("alice");
    });

    it("reads the name from the object older replays carry", () => {
        expect(controllerName({ name: "alice" })).toBe("alice");
    });

    it("is undefined without a controller", () => {
        expect(controllerName(undefined)).toBeUndefined();
    });
});
