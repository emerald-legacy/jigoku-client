import React from 'react';

interface AbilityLimit {
    max: number;
    current: number;
    exhausted: boolean;
}

interface AbilityPipsProps {
    abilityLimits: AbilityLimit[];
}

function AbilityPips({ abilityLimits }: AbilityPipsProps) {
    if(!abilityLimits || abilityLimits.length === 0) {
        return null;
    }

    return (
        <div className='ability-pips'>
            { abilityLimits.map((limit, i) => {
                const greenCount = limit.exhausted ? 0 : Math.max(1, limit.max - limit.current);
                const total = limit.current + greenCount;
                return (
                    <div key={ i } className='ability-pip-group'>
                        { Array.from({ length: total }, (_, j) => (
                            <div
                                key={ j }
                                className={ `ability-pip ${j < limit.current ? 'used' : 'available'}` }
                            />
                        )) }
                    </div>
                );
            }) }
        </div>
    );
}

export default AbilityPips;
