import React from "react";

interface AbilityLimit {
    max: number;
    current: number;
    exhausted: boolean;
}

interface AbilityUsedMarkerProps {
    abilityLimits: AbilityLimit[];
}

function AbilityUsedMarker({ abilityLimits }: AbilityUsedMarkerProps) {
    if(!abilityLimits || abilityLimits.length === 0) {
        return null;
    }

    const allExhausted = abilityLimits.every(l => l.exhausted);
    if(!allExhausted) {
        return null;
    }

    return <div className="ability-used-corner" />;
}

export default AbilityUsedMarker;
