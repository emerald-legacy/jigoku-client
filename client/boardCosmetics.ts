import type { User } from "./types/user";
import { asset } from "./assetUrl";

// Registry + resolution for board cosmetics. Two axes:
//   MATERIAL  wood (free) · nacre, gold (patron)
//   TYPE      default + the seven clans + five rings + imperial
//
// A dial choice is stored as the string "<material>/<type>" (e.g. "wood/default",
// "gold/crab"). Token choices store just a material id — the fate + honor tokens
// share one material.
//
// Visibility:
// - Honor dial is OWNER-visible: every player's own chosen dial is shown to everyone.
//   A patron-only material chosen by someone who is not (or no longer) a patron
//   downgrades to the same type in wood.
// - Fate + honor tokens are VIEWER-personal: only you see your own token material,
//   applied across your whole client. Spectators always see the default set.

export interface PatronOption {
    value: string;
    label: string;
    thumbnail: string;
}

export interface CosmeticMaterial {
    id: string;
    label: string;
    patron: boolean;
}

export interface CosmeticType {
    id: string;
    label: string;
}

// --- Registries -------------------------------------------------------------

export const dialMaterials: CosmeticMaterial[] = [
    { id: "wood", label: "Wood", patron: false },
    { id: "etched", label: "Etched", patron: false },
    { id: "nacre", label: "Nacre", patron: true },
    { id: "gold", label: "Gold", patron: true }
];

export const dialTypes: CosmeticType[] = [
    { id: "default", label: "Default" },
    { id: "crab", label: "Crab" },
    { id: "crane", label: "Crane" },
    { id: "dragon", label: "Dragon" },
    { id: "lion", label: "Lion" },
    { id: "phoenix", label: "Phoenix" },
    { id: "scorpion", label: "Scorpion" },
    { id: "unicorn", label: "Unicorn" },
    { id: "5rings", label: "Five Rings" },
    { id: "imperial", label: "Imperial" }
];

export const tokenMaterials: CosmeticMaterial[] = [
    { id: "default", label: "Default", patron: false },
    { id: "wood", label: "Wood", patron: false },
    { id: "etched", label: "Etched", patron: false },
    { id: "nacre", label: "Nacre", patron: true },
    { id: "gold", label: "Gold", patron: true }
];

const PATRON_MATERIALS = new Set(["gold", "nacre"]);

export const DEFAULT_DIAL = "wood/default"; // free default rendered for everyone
export const DEFAULT_PATRON_DIAL = "nacre/default"; // shown for a patron whose pick isn't transmitted
export const DEFAULT_TOKENS = "default";

// Fallback frame used when a (placeholder/missing) dial asset fails to load in the picker.
export const FALLBACK_DIAL_FRAME = asset("dials/wood/default.webp");

// --- Honor dials -----------------------------------------------------------
// The dial digits (0..5) are the same plain numbers for every set and live under
// the dials asset folder. Only the fan FRAME (the background behind the digit) changes per set.
export function honorDialDigit(bid: number): string {
    return asset(`dials/honorfan-${bid}.webp`);
}

export function parseDial(set: string | undefined): { material: string; type: string } {
    if(set && set.includes("/")) {
        const [material, type] = set.split("/", 2);
        return { material, type };
    }
    return migrateLegacyDial(set);
}

// Pre-redesign dial values were a bare set name ("default", "gold", "sakura", "ember").
function migrateLegacyDial(value: string | undefined): { material: string; type: string } {
    switch(value) {
        case "gold": return { material: "gold", type: "default" };
        case "nacre": return { material: "nacre", type: "default" };
        default: return { material: "wood", type: "default" };
    }
}

export function formatDial(material: string, type: string): string {
    return `${material}/${type}`;
}

export function dialFrame(material: string, type: string): string {
    return asset(`dials/${material}/${type}.webp`);
}

export function honorDialFrame(set: string): string {
    const { material, type } = parseDial(set);
    return dialFrame(material, type);
}

// Which dial to render for a player, given the dial they chose (transmitted in their
// user settings) and whether they are currently a patron. Patron materials are gated
// at SELECTION (the picker locks them for non-patrons), so here we simply render the
// chosen dial as-is — opponents and spectators see a patron's real gold/nacre art.
// `ownerIsPatron` only decides the fallback when no dial choice was transmitted.
export function resolveDialSet(ownerDial: string | undefined, ownerIsPatron: boolean): string {
    if(!ownerDial) {
        return ownerIsPatron ? DEFAULT_PATRON_DIAL : DEFAULT_DIAL;
    }
    const { material, type } = parseDial(ownerDial);
    return formatDial(material, type);
}

// --- Tokens (fate + honor + first-player share a material) ------------------
export function tokenImage(material: string, kind: "fate" | "honor" | "firstplayer"): string {
    return asset(`tokens/${material}/${kind}.webp`);
}

// Honour-status stones (honored / dishonored / tainted) are not selectable cosmetics;
// they always use their own stone art, independent of the chosen token material.
export const DEFAULT_HONORED_STONE = asset("tokens/honor_stone.webp");
export const DEFAULT_DISHONORED_STONE = asset("tokens/dishonor_stone.webp");

// The token material the viewer actually sees: patron materials require patron status,
// and spectators always fall back to the default set.
function viewerTokenMaterial(viewer: PatronViewerConfig): string {
    if(viewer.spectating) {
        return DEFAULT_TOKENS;
    }
    const material = viewer.tokens || DEFAULT_TOKENS;
    if(PATRON_MATERIALS.has(material) && !viewer.isPatron) {
        return DEFAULT_TOKENS;
    }
    return material;
}

// Fate image for the viewer's own client (viewer-personal cosmetic).
export function resolveFateImage(viewer: PatronViewerConfig): string {
    return tokenImage(viewerTokenMaterial(viewer), "fate");
}

// Honor resource icon / honored token for the viewer's own client (viewer-personal).
export function resolveHonorImage(viewer: PatronViewerConfig): string {
    return tokenImage(viewerTokenMaterial(viewer), "honor");
}

// First-player token for the viewer's own client (viewer-personal, shares the token material).
export function resolveFirstPlayerImage(viewer: PatronViewerConfig): string {
    return tokenImage(viewerTokenMaterial(viewer), "firstplayer");
}

// Honour-status stones use their dedicated stone art, NOT the per-material honor token
// (the honor token is for the player honour bar and cards that place honor tokens).
export function resolveStoneImages(): { honored: string; dishonored: string } {
    return { honored: DEFAULT_HONORED_STONE, dishonored: DEFAULT_DISHONORED_STONE };
}

// --- Rings (single patron set, toggled) -------------------------------------
export function patronRingImage(element: string): string {
    return asset(`patron/rings/${element}.png`);
}

export const ringElements = ["air", "earth", "fire", "void", "water"] as const;

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

// --- Settings + viewer config ----------------------------------------------

export interface PatronSettings {
    dial: string; // "<material>/<type>"
    tokens: string; // token material id
    rings: boolean;
    usePromos: boolean; // owner-broadcast: render this player's cards with promo art
}

export interface PatronViewerConfig extends PatronSettings {
    isPatron: boolean;
    spectating: boolean;
}

export const defaultPatronSettings: PatronSettings = {
    dial: DEFAULT_DIAL,
    tokens: DEFAULT_TOKENS,
    rings: false,
    usePromos: false
};

// Coerce a stored dial value to a valid "<material>/<type>" string (handles legacy names).
export function normalizeDialValue(value: unknown): string {
    if(typeof value !== "string" || !value) {
        return DEFAULT_DIAL;
    }
    const { material, type } = parseDial(value);
    return formatDial(material, type);
}

// Coerce a stored token value to a valid material id (handles the legacy boolean toggle).
export function normalizeTokenValue(value: unknown): string {
    if(typeof value === "string" && tokenMaterials.some(m => m.id === value)) {
        return value;
    }
    return DEFAULT_TOKENS;
}

export function normalizePatronSettings(raw: Record<string, unknown> | undefined): PatronSettings {
    const value = raw ?? {};
    return {
        dial: normalizeDialValue(value.dial),
        tokens: normalizeTokenValue(value.tokens),
        rings: typeof value.rings === "boolean" ? value.rings : false,
        usePromos: typeof value.usePromos === "boolean" ? value.usePromos : false
    };
}

export const defaultViewerConfig: PatronViewerConfig = {
    isPatron: false,
    spectating: false,
    ...defaultPatronSettings
};

// Builds the viewer config from the logged-in user's account + whether they are spectating.
// Pure (no hooks): the value is computed once in InnerGameBoard and provided via PatronContext.
export function computeViewerConfig(user: User | undefined, spectating: boolean): PatronViewerConfig {
    return {
        isPatron: !!user?.permissions?.isPatron,
        spectating,
        ...normalizePatronSettings(user?.settings?.patron as Record<string, unknown> | undefined)
    };
}
