import type { User } from "./types/user";

// Registry + resolution for patron cosmetic options. Mirrors the pattern in backgrounds.ts.
//
// Visibility rules (see feature spec):
// - Honour dial + rings are OWNER-dependent: opponents and spectators of a patron see the
//   patron's themed dial/rings. A patron VIEWER overrides with their own chosen dial/rings.
// - Fate tokens + honour/dishonour stones are VIEWER-personal cosmetics: only the patron
//   themselves sees them, applied across their own client. Opponents/spectators never see them.

export interface PatronOption {
    value: string;
    label: string;
    thumbnail: string;
}

export interface PatronSettings {
    dial: string;
    fate: string;
    rings: boolean;
    tokens: boolean;
}

export interface PatronViewerConfig extends PatronSettings {
    isPatron: boolean;
    spectating: boolean;
}

export const ringElements = ["air", "earth", "fire", "void", "water"] as const;

// --- Honour dials -----------------------------------------------------------
// Each dial set provides honorfan-0..5 images under its base path. "default" = stock images.
const DIAL_DEFAULT_BASE = "/img";

function dialBase(value: string): string {
    return value === "default" ? DIAL_DEFAULT_BASE : `/img/patron/dials/${value}`;
}

export function honorDialImage(value: string, bid: number): string {
    return `${dialBase(value)}/honorfan-${bid}.webp`;
}

// Add patron dial sets here as their assets are added under /public/img/patron/dials/<value>/.
export const patronHonorDials: PatronOption[] = [
    { value: "default", label: "Default", thumbnail: honorDialImage("default", 3) },
    { value: "sakura", label: "Sakura", thumbnail: honorDialImage("sakura", 3) },
    { value: "ember", label: "Ember", thumbnail: honorDialImage("ember", 3) }
];

// What a non-patron opponent / spectator sees for a patron player's dial.
export const DEFAULT_PATRON_DIAL = "sakura";

// --- Fate tokens ------------------------------------------------------------
function fateImage(value: string): string {
    return value === "default" ? "/img/Fate.png" : `/img/patron/fate/${value}.png`;
}

// Add patron fate sets here as their assets are added under /public/img/patron/fate/.
export const patronFateTokens: PatronOption[] = [
    { value: "default", label: "Default", thumbnail: fateImage("default") },
    { value: "sakura", label: "Sakura", thumbnail: fateImage("sakura") }
];

// --- Honour / dishonour stones (single patron pair, toggled) ----------------
export const DEFAULT_HONORED_STONE = "/img/honor_stone.webp";
export const DEFAULT_DISHONORED_STONE = "/img/dishonor_stone.webp";
export const PATRON_HONORED_STONE = "/img/patron/honor-stone.png";
export const PATRON_DISHONORED_STONE = "/img/patron/dishonor-stone.png";

// --- Rings (single patron set, toggled) -------------------------------------
export function patronRingImage(element: string): string {
    return `/img/patron/rings/${element}.png`;
}

export const defaultPatronSettings: PatronSettings = {
    dial: "default",
    fate: "default",
    rings: false,
    tokens: false
};

// --- Resolution (pure) ------------------------------------------------------

// Which dial SET value to render for a player's dial, given the owner's patron status.
export function resolveDialSet(ownerIsPatron: boolean, viewer: PatronViewerConfig): string {
    if(!ownerIsPatron) {
        return "default";
    }
    if(viewer.isPatron && !viewer.spectating) {
        return viewer.dial;
    }
    return DEFAULT_PATRON_DIAL;
}

// Whether to render patron ring imagery for a claimed-pool ring owned by a player.
export function resolveOwnedRingsPatron(ownerIsPatron: boolean, viewer: PatronViewerConfig): boolean {
    if(!ownerIsPatron) {
        return false;
    }
    if(viewer.isPatron && !viewer.spectating) {
        return viewer.rings;
    }
    return true;
}

// Center (unclaimed) rings have no owner: only the patron viewer reskins them for themselves.
export function resolveCenterRingsPatron(viewer: PatronViewerConfig): boolean {
    return viewer.isPatron && !viewer.spectating && viewer.rings;
}

// Fate image for the viewer's own client (viewer-personal cosmetic).
export function resolveFateImage(viewer: PatronViewerConfig): string {
    if(viewer.isPatron && !viewer.spectating && viewer.fate !== "default") {
        return fateImage(viewer.fate);
    }
    return "/img/Fate.png";
}

// Honour resource icon for the viewer's own client. Patrons with the token option enabled
// reuse their honoured-token art for honour icons (viewer-personal cosmetic).
export function resolveHonorImage(viewer: PatronViewerConfig): string {
    if(viewer.isPatron && !viewer.spectating && viewer.tokens) {
        return PATRON_HONORED_STONE;
    }
    return "/img/Honor.png";
}

// Honour/dishonour stone images for the viewer's own client (viewer-personal cosmetic).
export function resolveStoneImages(viewer: PatronViewerConfig): { honored: string; dishonored: string } {
    if(viewer.isPatron && !viewer.spectating && viewer.tokens) {
        return { honored: PATRON_HONORED_STONE, dishonored: PATRON_DISHONORED_STONE };
    }
    return { honored: DEFAULT_HONORED_STONE, dishonored: DEFAULT_DISHONORED_STONE };
}

// --- Viewer config ----------------------------------------------------------

export const defaultViewerConfig: PatronViewerConfig = {
    isPatron: false,
    spectating: false,
    ...defaultPatronSettings
};

// Builds the viewer config from the logged-in user's account + whether they are spectating.
// Pure (no hooks): the value is computed once in InnerGameBoard and provided via PatronContext.
export function computeViewerConfig(user: User | undefined, spectating: boolean): PatronViewerConfig {
    const isPatron = !!user?.permissions?.isPatron;
    const raw = (user?.settings?.patron ?? {}) as Partial<PatronSettings>;
    return {
        isPatron,
        spectating,
        dial: raw.dial || defaultPatronSettings.dial,
        fate: raw.fate || defaultPatronSettings.fate,
        rings: raw.rings ?? defaultPatronSettings.rings,
        tokens: raw.tokens ?? defaultPatronSettings.tokens
    };
}
