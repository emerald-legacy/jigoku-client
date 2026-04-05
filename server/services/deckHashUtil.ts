const crypto = require("crypto");

/**
 * Compute a deterministic SHA-256 hash of a deck's card content.
 * Excludes name, format, lastUpdated — only hashes the cards themselves.
 */
function computeDeckContentHash(deck) {
    const parts = {
        faction: deck.faction?.value || "",
        alliance: deck.alliance?.value || "",
        stronghold: normalizeCards(deck.stronghold),
        role: normalizeCards(deck.role),
        provinceCards: normalizeCards(deck.provinceCards),
        dynastyCards: normalizeCards(deck.dynastyCards),
        conflictCards: normalizeCards(deck.conflictCards)
    };

    const canonical = JSON.stringify(parts);
    return crypto.createHash("sha256").update(canonical).digest("hex");
}

function normalizeCards(cards) {
    if(!cards || !Array.isArray(cards)) {
        return [];
    }

    return cards
        .map(c => {
            const id = c.card?.id || c.card;
            return `${c.count}:${id}`;
        })
        .sort();
}

module.exports = { computeDeckContentHash };
