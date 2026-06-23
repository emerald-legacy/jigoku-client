import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";

import { useOwnerShowsPromo, PatronProvider } from "../../client/PatronContext";

// usePatronStatuses fetches patron status via axios; stub it so the provider's isPatronByUsername
// is deterministic and synchronous in tests.
const patronByName = vi.hoisted(() => ({ map: {} as Record<string, boolean> }));
vi.mock("../../client/patronStatus", () => ({
    usePatronStatuses: () => patronByName.map
}));

const wrapperWith = (usePromosByUsername: Record<string, boolean>) =>
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <PatronProvider
                viewer={ { dial: "wood/default", tokens: "default", rings: "default", usePromos: false, isPatron: false, spectating: false } }
                playerUsernames={ Object.keys({ ...patronByName.map, ...usePromosByUsername }) }
                usePromosByUsername={ usePromosByUsername }
                ringSetByUsername={ {} }
            >
                { children }
            </PatronProvider>
        );
    };

describe("useOwnerShowsPromo", () => {
    it("returns true only when the owner is a patron AND has promos enabled", () => {
        patronByName.map = { gold: true };
        const { result } = renderHook(() => useOwnerShowsPromo("gold"), { wrapper: wrapperWith({ gold: true }) });
        expect(result.current).toBe(true);
    });

    it("returns false when the owner is a patron but promos are disabled", () => {
        patronByName.map = { gold: true };
        const { result } = renderHook(() => useOwnerShowsPromo("gold"), { wrapper: wrapperWith({ gold: false }) });
        expect(result.current).toBe(false);
    });

    it("returns false when the owner has promos enabled but is not a patron", () => {
        patronByName.map = { gold: false };
        const { result } = renderHook(() => useOwnerShowsPromo("gold"), { wrapper: wrapperWith({ gold: true }) });
        expect(result.current).toBe(false);
    });

    it("returns false for an unknown owner or no username", () => {
        patronByName.map = { gold: true };
        const wrapper = wrapperWith({ gold: true });
        expect(renderHook(() => useOwnerShowsPromo("someone-else"), { wrapper }).result.current).toBe(false);
        expect(renderHook(() => useOwnerShowsPromo(undefined), { wrapper }).result.current).toBe(false);
    });

    it("returns false with no provider (neutral default)", () => {
        expect(renderHook(() => useOwnerShowsPromo("gold")).result.current).toBe(false);
    });
});
