import React, { createContext, useContext, useMemo } from "react";
import { usePatronStatuses } from "./patronStatus";
import { defaultViewerConfig, type PatronViewerConfig } from "./boardCosmetics";

interface PatronContextValue {
    viewer: PatronViewerConfig;
    isPatronByUsername: Record<string, boolean>;
}

const PatronContext = createContext<PatronContextValue>({
    viewer: defaultViewerConfig,
    isPatronByUsername: {}
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

interface PatronProviderProps {
    viewer: PatronViewerConfig;
    playerUsernames: Array<string | null | undefined>;
    children: React.ReactNode;
}

export function PatronProvider({ viewer, playerUsernames, children }: PatronProviderProps) {
    const isPatronByUsername = usePatronStatuses(playerUsernames);
    const value = useMemo(() => ({ viewer, isPatronByUsername }), [viewer, isPatronByUsername]);
    return <PatronContext.Provider value={ value }>{ children }</PatronContext.Provider>;
}
