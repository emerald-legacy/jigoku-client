import bootstrap from "./bootstrap";
import { asset } from "./assetUrl";
import type { Card } from "./types/game";

export interface CardVersion {
    pack_id?: string;
    image_url?: string;
    name?: string;
}

export type CardWithVersions = Card & { versions?: CardVersion[] };

const versionSuffix = bootstrap.cardImageVersion
    ? `?v=${bootstrap.cardImageVersion}`
    : "";

export function getCardImageUrl(cardId: string, packId?: string): string {
    if(!cardId) {
        return "";
    }
    const base = packId
        ? `/img/cards/${cardId}-${packId}.jpg`
        : `/img/cards/${cardId}.jpg`;
    return `${base}${versionSuffix}`;
}

export function getCardBackUrl(filename: string): string {
    return asset(`cardbacks/${filename}`);
}

const communityFormats = new Set(["emerald", "sanctuary", "obsidian"]);

/**
 * Pick the preferred pack_id from a card's versions array based on game format.
 * Community formats (emerald, sanctuary, obsidian) prefer the last version (EL printing).
 * Imperial formats (stronghold, skirmish) prefer the first version (FFG printing).
 */
export function preferredPackId(card: CardWithVersions | undefined, formatValue: string): string | undefined {
    const versions = card?.versions;
    if(!versions || versions.length === 0) {
        return undefined;
    }
    if(communityFormats.has(formatValue)) {
        return versions[versions.length - 1].pack_id;
    }
    return versions[0].pack_id;
}
