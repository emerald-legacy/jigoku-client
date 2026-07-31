import { describe, it, expect } from "vitest";
import { rejectionMessage } from "../../client/util";

const fallback = "Could not communicate with the server.";

describe("rejectionMessage", () => {
    it("should read the payload thrown by unwrap() on a rejectWithValue rejection", () => {
        expect(rejectionMessage({ message: "Invalid Username/password", status: 401 }, fallback))
            .toBe("Invalid Username/password");
    });

    it("should read an Error message", () => {
        expect(rejectionMessage(new Error("boom"), fallback)).toBe("boom");
    });

    it("should read a plain string", () => {
        expect(rejectionMessage("boom", fallback)).toBe("boom");
    });

    it("should fall back when there is nothing to read", () => {
        expect(rejectionMessage(undefined, fallback)).toBe(fallback);
        expect(rejectionMessage(null, fallback)).toBe(fallback);
        expect(rejectionMessage({}, fallback)).toBe(fallback);
        expect(rejectionMessage({ message: "" }, fallback)).toBe(fallback);
        expect(rejectionMessage({ message: 42 }, fallback)).toBe(fallback);
    });
});
