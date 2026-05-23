
interface Modifier {
    name: string;
    amount: number;
}

interface SkillSummary {
    stat: number;
    modifiers: Modifier[];
}

interface EffectMarkerEntry {
    source: string;
    kind: "delayed" | "modifier";
}

interface CardStatsProps {
    glorySummary?: SkillSummary;
    militarySkillSummary?: SkillSummary;
    politicalSkillSummary?: SkillSummary;
    strengthSummary?: SkillSummary;
    effectMarkers?: EffectMarkerEntry[];
}

function CardStats({ glorySummary, militarySkillSummary, politicalSkillSummary, strengthSummary, effectMarkers }: CardStatsProps) {
    const renderGroupedModifier = (groupedModifier: Modifier[]) => {
        const amount = groupedModifier.reduce((total, modifier) => total + modifier.amount, 0);
        let sign = "";
        let amountDisplay = "";
        if(!Number.isNaN(amount)) {
            sign = amount < 0 ? "-" : "+";
            amountDisplay = amount.toString().replace("-", "");
        } else {
            amountDisplay = "-";
        }
        return (
            <div className="stat-line" key={ groupedModifier[0].name }>
                <div className="stat-sign">{ sign }</div>
                <div className="stat-amount">{ amountDisplay }</div>
                <div className="stat-name">{ groupedModifier[0].name }</div>
            </div>
        );
    };

    const renderModifiers = (modifiers: Modifier[]) => {
        // Group modifiers by name
        const grouped: Record<string, Modifier[]> = {};
        for(const modifier of modifiers) {
            if(!grouped[modifier.name]) {
                grouped[modifier.name] = [];
            }
            grouped[modifier.name].push(modifier);
        }
        const groupedModifiers = Object.values(grouped);
        return groupedModifiers.map((groupedModifier) => renderGroupedModifier(groupedModifier));
    };

    return (
        <div className="panel menu card--stats ">
            { militarySkillSummary && (
                <div className="stat-container">
                    <div className="stat-total">
                        <span className="icon-military stat--type-icon" />
                        <span className="stat-value">{ militarySkillSummary.stat }</span>
                    </div>
                    <div className="stat-specifics">
                        { renderModifiers(militarySkillSummary.modifiers) }
                    </div>
                </div>
            ) }
            { politicalSkillSummary && (
                <div className="stat-container">
                    <div className="stat-total">
                        <span className="icon-political stat--type-icon" />
                        <span className="stat-value">{ politicalSkillSummary.stat }</span>
                    </div>
                    <div className="stat-specifics">
                        { renderModifiers(politicalSkillSummary.modifiers) }
                    </div>
                </div>
            ) }
            { glorySummary && (
                <div className="stat-container">
                    <div className="stat-total">
                        <img className="icon-glory stat--type-icon" src="/img/glory.png" />
                        <span className="stat-value">{ glorySummary.stat }</span>
                    </div>
                    <div className="stat-specifics">{ renderModifiers(glorySummary.modifiers) }</div>
                </div>
            ) }
            { strengthSummary && (
                <div className="stat-container">
                    <div className="stat-total">
                        <span className="stat--type-label">STR</span>
                        <span className="stat-value">{ strengthSummary.stat }</span>
                    </div>
                    <div className="stat-specifics">
                        { renderModifiers(strengthSummary.modifiers) }
                    </div>
                </div>
            ) }
            { effectMarkers && effectMarkers.length > 0 && (
                <div className="stat-container">
                    <div className="stat-total">
                        <span className="stat--type-label effect-markers-label">効</span>
                    </div>
                    <div className="stat-specifics">
                        { effectMarkers.map((e, i) => (
                            <div className="stat-line" key={ `${e.source}-${i}` }>
                                <div className="stat-name">{ e.source }</div>
                            </div>
                        )) }
                    </div>
                </div>
            ) }
        </div>
    );
}

CardStats.displayName = "CardStats";

export default CardStats;
