import { describe, it, expect } from "vitest";
import {
    initProfileState,
    profileReducer,
    validateEmail,
    validatePassword,
    type ProfileState
} from "../../client/Profile.reducer";

const baseState: ProfileState = initProfileState();

describe("initProfileState", () => {
    it("returns empty defaults when no user is supplied", () => {
        expect(initProfileState()).toEqual({
            account: { email: "", currentPassword: "", newPassword: "", newPasswordAgain: "" },
            settings: {
                disableGravatar: false,
                windowTimer: 0,
                background: "none",
                cardSize: "normal",
                promptedActionWindows: {},
                optionSettings: {},
                timerSettings: {},
                patron: { dial: "default", fate: "default", rings: false, tokens: false }
            },
            validation: {},
            loading: false
        });
    });

    it("hydrates from a user, including nested settings and prompted windows", () => {
        const state = initProfileState({
            email: "a@b.io",
            settings: {
                disableGravatar: true,
                windowTimer: 4,
                background: "CRAB",
                cardSize: "large",
                optionSettings: { sortHandByName: true },
                timerSettings: { events: true }
            },
            promptedActionWindows: { dynasty: true }
        });
        expect(state.account.email).toBe("a@b.io");
        expect(state.settings).toEqual({
            disableGravatar: true,
            windowTimer: 4,
            background: "CRAB",
            cardSize: "large",
            promptedActionWindows: { dynasty: true },
            optionSettings: { sortHandByName: true },
            timerSettings: { events: true },
            patron: { dial: "default", fate: "default", rings: false, tokens: false }
        });
    });
});

describe("profileReducer", () => {
    it("updates a single account field without disturbing other fields", () => {
        const next = profileReducer(baseState, { type: "account", field: "email", value: "x@y.io" });
        expect(next.account.email).toBe("x@y.io");
        expect(next.account.currentPassword).toBe("");
    });

    it("updates a single top-level setting", () => {
        const next = profileReducer(baseState, { type: "setting", field: "background", value: "DRAGON" });
        expect(next.settings.background).toBe("DRAGON");
        expect(next.settings.cardSize).toBe("normal");
    });

    it("toggles a key inside a nested settings map without dropping siblings", () => {
        const seeded = profileReducer(baseState, { type: "toggle", map: "optionSettings", field: "sortHandByName", value: true });
        const next = profileReducer(seeded, { type: "toggle", map: "optionSettings", field: "confirmOneClick", value: true });
        expect(next.settings.optionSettings).toEqual({ sortHandByName: true, confirmOneClick: true });
    });

    it("sets a validation error for a field", () => {
        const next = profileReducer(baseState, { type: "validation", field: "email", error: "bad" });
        expect(next.validation).toEqual({ email: "bad" });
    });

    it("clears a validation error when error is undefined", () => {
        const withError = profileReducer(baseState, { type: "validation", field: "email", error: "bad" });
        const cleared = profileReducer(withError, { type: "validation", field: "email" });
        expect(cleared.validation).toEqual({});
    });

    it("submitStart sets loading and clears prior banner messages", () => {
        const withBanner = { ...baseState, errorMessage: "x", successMessage: "y" };
        const next = profileReducer(withBanner, { type: "submitStart" });
        expect(next).toMatchObject({ loading: true, errorMessage: undefined, successMessage: undefined });
    });

    it("submitSuccess stops loading and sets the success message", () => {
        const next = profileReducer({ ...baseState, loading: true }, { type: "submitSuccess", message: "ok" });
        expect(next.loading).toBe(false);
        expect(next.successMessage).toBe("ok");
    });

    it("submitError stops loading and sets the error message", () => {
        const next = profileReducer({ ...baseState, loading: true }, { type: "submitError", message: "boom" });
        expect(next.loading).toBe(false);
        expect(next.errorMessage).toBe("boom");
    });

    it("hydrate refreshes email, gravatar and prompted windows but not user-edited account fields", () => {
        const dirty = profileReducer(baseState, { type: "account", field: "newPassword", value: "secret" });
        const next = profileReducer(dirty, {
            type: "hydrate",
            user: { email: "fresh@x.io", settings: { disableGravatar: true }, promptedActionWindows: { fate: true } }
        });
        expect(next.account.email).toBe("fresh@x.io");
        expect(next.account.newPassword).toBe("secret");
        expect(next.settings.disableGravatar).toBe(true);
        expect(next.settings.promptedActionWindows).toEqual({ fate: true });
    });
});

describe("validateEmail", () => {
    it("returns undefined for a valid address", () => {
        expect(validateEmail("a@b.io")).toBeUndefined();
    });

    it("returns an error for a clearly invalid address", () => {
        expect(validateEmail("not-an-email")).toBe("Please enter a valid email address");
    });
});

describe("validatePassword", () => {
    it("returns undefined when both fields are empty (no password change requested)", () => {
        expect(validatePassword("", "", true)).toBeUndefined();
    });

    it("returns a length error for passwords shorter than 6 characters", () => {
        expect(validatePassword("abc", "abc", false)).toBe("The password you specify must be at least 6 characters long");
    });

    it("on submit, requires the confirmation field", () => {
        expect(validatePassword("longenough", "", true)).toBe("Please enter your password again");
    });

    it("off-submit, an empty confirmation is fine (user is still typing)", () => {
        expect(validatePassword("longenough", "", false)).toBeUndefined();
    });

    it("returns mismatch when both filled but unequal", () => {
        expect(validatePassword("longenough", "different", false)).toBe("The passwords you have specified do not match");
    });

    it("returns undefined when both passwords match and are long enough", () => {
        expect(validatePassword("longenough", "longenough", true)).toBeUndefined();
    });
});
