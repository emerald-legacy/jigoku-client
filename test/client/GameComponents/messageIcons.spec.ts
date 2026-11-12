import { describe, it, expect } from "vitest";
import { isCountedIcon } from "../../../client/GameComponents/messageIcons";

describe("isCountedIcon", () => {
    it("shows a resource icon after a number", () => {
        expect(isCountedIcon(["gain", " ", 1, " ", "fate"], 4)).toBe(true);
        expect(isCountedIcon(["draw", " ", "2", " ", "cards"], 4)).toBe(true);
    });

    it("shows a resource icon after 'a' or a number word", () => {
        expect(isCountedIcon(["draw", " ", "a", " ", "card"], 4)).toBe(true);
        expect(isCountedIcon(["top", " ", "three", " ", "cards"], 4)).toBe(true);
    });

    it("shows a resource icon directly after a count fragment", () => {
        expect(isCountedIcon(["+2", "honor"], 1)).toBe(true);
    });

    it("keeps verbs and plain nouns as words", () => {
        expect(isCountedIcon(["and", " ", "honor", " ", "them"], 2)).toBe(false);
        expect(isCountedIcon(["a", " ", "facedown", " ", "card"], 4)).toBe(false);
        expect(isCountedIcon(["honor"], 0)).toBe(false);
    });

    it("ignores other words", () => {
        expect(isCountedIcon([2, " ", "military"], 2)).toBe(false);
    });
});
