import React from "react";

interface AbilityLimit {
    max: number;
    current: number;
    exhausted: boolean;
}

interface AbilityUsedMarkerProps {
    abilityLimits: AbilityLimit[];
    isAttachment?: boolean;
}

function AbilityUsedMarker({ abilityLimits, isAttachment = false }: AbilityUsedMarkerProps) {
    if(!abilityLimits || abilityLimits.length === 0) {
        return null;
    }

    const allExhausted = abilityLimits.every(l => l.exhausted || l.current >= l.max);
    if(!allExhausted) {
        return null;
    }

    return <div className={ isAttachment ? "ability-used-corner-bottom-left" : "ability-used-corner" } />;
}

export default AbilityUsedMarker;
