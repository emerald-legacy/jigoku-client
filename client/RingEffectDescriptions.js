const defaultEffects = {
    air: 'Gain 2 honor, or take 1 honor from your opponent',
    earth: 'Draw a card and your opponent discards a card',
    fire: 'Honor or dishonor a character',
    void: 'Remove 1 fate from a character',
    water: 'Bow a character with no fate, or ready a bowed character'
};

const skirmishEffects = {
    air: 'Take 1 honor from your opponent',
    earth: 'Draw a card, or your opponent discards a card',
    fire: 'Honor or dishonor a character',
    void: 'Remove 1 fate from a character',
    water: 'Bow or ready a non-participating character with 1 or fewer fate'
};

const RingEffectDescriptions = {
    stronghold: defaultEffects,
    emerald: defaultEffects,
    obsidian: defaultEffects,
    sanctuary: defaultEffects,
    skirmish: skirmishEffects
};

export function getRingEffect(gameMode, element) {
    const modeEffects = RingEffectDescriptions[gameMode] || defaultEffects;
    return modeEffects[element] || '';
}
