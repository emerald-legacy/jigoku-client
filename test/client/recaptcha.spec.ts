import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

async function freshModule() {
    vi.resetModules();
    return import("../../client/recaptcha");
}

function recaptchaScripts(): HTMLScriptElement[] {
    return Array.from(document.head.querySelectorAll<HTMLScriptElement>("script[src*='recaptcha']"));
}

describe("recaptcha loader", () => {
    beforeEach(() => {
        recaptchaScripts().forEach((script) => script.remove());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("adds the script only once, however often it is asked for", async () => {
        const { loadRecaptcha } = await freshModule();

        const first = loadRecaptcha();
        const second = loadRecaptcha();
        expect(recaptchaScripts()).toHaveLength(1);

        recaptchaScripts()[0].onload?.(new Event("load"));
        await expect(Promise.all([first, second])).resolves.toBeDefined();
    });

    it("tries again after the script failed to load", async () => {
        const { loadRecaptcha } = await freshModule();

        const failed = loadRecaptcha();
        recaptchaScripts()[0].onerror?.(new Event("error"));
        await expect(failed).rejects.toThrow("Could not load reCAPTCHA");
        expect(recaptchaScripts()).toHaveLength(0);

        loadRecaptcha();
        expect(recaptchaScripts()).toHaveLength(1);
    });

    it("returns the token for the action once the script has loaded", async () => {
        const execute = vi.fn().mockResolvedValue("token-123");
        vi.stubGlobal("grecaptcha", { ready: (callback: () => void) => callback(), execute });
        const { getRecaptchaToken } = await freshModule();

        const token = getRecaptchaToken("submit");
        recaptchaScripts()[0].onload?.(new Event("load"));

        await expect(token).resolves.toBe("token-123");
        expect(execute).toHaveBeenCalledWith(expect.any(String), { action: "submit" });
    });
});
