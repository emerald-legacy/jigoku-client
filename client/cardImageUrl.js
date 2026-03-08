/* global cardImageVersion */

const versionSuffix = typeof cardImageVersion !== 'undefined' && cardImageVersion
    ? '?v=' + cardImageVersion
    : '';

export function getCardImageUrl(cardId, packId) {
    if(!cardId) {
        return '';
    }
    const base = packId
        ? '/img/cards/' + cardId + '-' + packId + '.jpg'
        : '/img/cards/' + cardId + '.jpg';
    return base + versionSuffix;
}

export function getCardBackUrl(filename) {
    return '/img/cards/' + filename + versionSuffix;
}
