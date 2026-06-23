import React, { createContext, useContext, useMemo } from "react";
import { usePatronStatuses } from "./patronStatus";
import { defaultViewerConfig, resolveRingSet, DEFAULT_RINGS, type PatronViewerConfig } from "./boardCosmetics";

interface PatronContextValue {
    viewer: PatronViewerConfig;
    isPatronByUsername: Record<string, boolean>;
    // Each player's broadcast usePromos, keyed by username (owner-broadcast, like the dial).
    usePromosByUsername: Record<string, boolean>;
    // The single ring set this viewer sees across the whole board (set id; "default" = stock).
    ringSet: string;
}

const PatronContext = createContext<PatronContextValue>({
    viewer: defaultViewerConfig,
    isPatronByUsername: {},
    usePromosByUsername: {},
    ringSet: DEFAULT_RINGS
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

// The ring set the viewer should see, board-wide. "default" means stock bg + svg glyph.
export function useRingSet(): string {
    return useContext(PatronContext).ringSet;
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
    ringSetByUsername: Record<string, string>;
    creatorUsername?: string;
    viewerUsername?: string | null;
    children: React.ReactNode;
}

export function PatronProvider({ viewer, playerUsernames, usePromosByUsername, ringSetByUsername, creatorUsername, viewerUsername, children }: PatronProviderProps) {
    const isPatronByUsername = usePatronStatuses(playerUsernames);
    const ringSet = useMemo(
        () => resolveRingSet({ viewer, isPatronByUsername, ringSetByUsername, playerUsernames, creatorUsername, viewerUsername }),
        [viewer, isPatronByUsername, ringSetByUsername, playerUsernames, creatorUsername, viewerUsername]
    );
    const value = useMemo(
        () => ({ viewer, isPatronByUsername, usePromosByUsername, ringSet }),
        [viewer, isPatronByUsername, usePromosByUsername, ringSet]
    );
    return <PatronContext.Provider value={ value }>{ children }</PatronContext.Provider>;
}
