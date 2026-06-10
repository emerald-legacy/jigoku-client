import React, { createContext, useContext, useMemo } from "react";
import { usePatronStatuses } from "./patronStatus";
import { defaultViewerConfig, type PatronViewerConfig } from "./boardCosmetics";

interface PatronContextValue {
    viewer: PatronViewerConfig;
    isPatronByUsername: Record<string, boolean>;
    // Each player's broadcast usePromos, keyed by username (owner-broadcast, like the dial).
    usePromosByUsername: Record<string, boolean>;
}

const PatronContext = createContext<PatronContextValue>({
    viewer: defaultViewerConfig,
    isPatronByUsername: {},
    usePromosByUsername: {}
});

// Consumed by board components. With no provider (e.g. isolated component tests) these return
// neutral defaults, so rendering falls back to the stock (non-patron) imagery.
export function usePatronViewerConfig(): PatronViewerConfig {
    return useContext(PatronContext).viewer;
}

export function usePatronOwnerStatus(username?: string | null): boolean {
    const map = useContext(PatronContext).isPatronByUsername;
    return username ? !!map[username] : false;
}

// Whether a card owned by `username` should render promo art: owner is a patron with promos on.
export function useOwnerShowsPromo(username?: string | null): boolean {
    const { isPatronByUsername, usePromosByUsername } = useContext(PatronContext);
    if(!username) {
        return false;
    }
    return !!isPatronByUsername[username] && !!usePromosByUsername[username];
}

interface PatronProviderProps {
    viewer: PatronViewerConfig;
    playerUsernames: Array<string | null | undefined>;
    usePromosByUsername: Record<string, boolean>;
    children: React.ReactNode;
}

export function PatronProvider({ viewer, playerUsernames, usePromosByUsername, children }: PatronProviderProps) {
    const isPatronByUsername = usePatronStatuses(playerUsernames);
    const value = useMemo(
        () => ({ viewer, isPatronByUsername, usePromosByUsername }),
        [viewer, isPatronByUsername, usePromosByUsername]
    );
    return <PatronContext.Provider value={ value }>{ children }</PatronContext.Provider>;
}
