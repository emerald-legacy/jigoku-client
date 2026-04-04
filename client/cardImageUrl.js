/* global cardImageVersion */

const versionSuffix = typeof cardImageVersion !== "undefined" && cardImageVersion
    ? `?v=${cardImageVersion}`
    : "";

export function getCardImageUrl(cardId, packId) {
    if(!cardId) {
        return "";
    }
    const base = packId
        ? `/img/cards/${cardId}-${packId}.jpg`
        : `/img/cards/${cardId}.jpg`;
    return `${base}${versionSuffix}`;
}

export function getCardBackUrl(filename) {
    return `/img/cards/${filename}${versionSuffix}`;
}

const communityFormats = new Set(["emerald", "sanctuary", "obsidian"]);

/**
 * Pick the preferred pack_id from a card's versions array based on game format.
 * Community formats (emerald, sanctuary, obsidian) prefer the last version (EL printing).
 * Imperial formats (stronghold, skirmish) prefer the first version (FFG printing).
 */
export function preferredPackId(card, formatValue) {
    const versions = card?.versions;
    if(!versions || versions.length === 0) {
        return undefined;
    }
    if(communityFormats.has(formatValue)) {
        return versions[versions.length - 1].pack_id;
    }
    return versions[0].pack_id;
}
