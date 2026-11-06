import React from "react";
import type { Card, Player, ConflictInfo } from "../types/game";

interface ConflictPanelProps {
    conflict: ConflictInfo;
    thisPlayer?: Player;
    otherPlayer?: Player;
}

const isPlayer = (player: Player | undefined, playerId: string | undefined) => !!(player?.id && playerId && player.id.includes(playerId));

/** The defender's provinces in the conflict, with their current strength (modifiers included). */
function conflictProvinces(defender: Player | undefined): Card[] {
    if(!defender) {
        return [];
    }
    const piles = [...Object.values(defender.provinces ?? {}), defender.strongholdProvince ?? []];
    return piles.flat().filter((card) => card.isProvince && card.inConflict && card.strengthSummary?.stat !== undefined);
}

export default function ConflictPanel({ conflict, thisPlayer, otherPlayer }: ConflictPanelProps) {
    if(!conflict.attackingPlayerId) {
        return <div />;
    }

    const otherIsAttacker = isPlayer(otherPlayer, conflict.attackingPlayerId);
    const otherIsDefender = !otherIsAttacker && isPlayer(otherPlayer, conflict.defendingPlayerId);
    const attackerSkill = conflict.attackerSkill !== undefined ? conflict.attackerSkill : "-";
    const defenderSkill = conflict.defenderSkill !== undefined && !conflict.unopposed ? conflict.defenderSkill : "-";

    let thisPlayerSkill: number | string = attackerSkill;
    let otherPlayerSkill: number | string = "-";
    if(otherIsAttacker) {
        otherPlayerSkill = attackerSkill;
        thisPlayerSkill = defenderSkill;
    } else if(otherIsDefender) {
        otherPlayerSkill = defenderSkill;
    }

    // The attacker's skill is underlined; once both sides have a skill, the side that would lose is dimmed.
    const contested = !conflict.unopposed && conflict.attackerWins !== undefined;
    const skillClass = (isAttacker: boolean) => {
        let className = "phase-display";
        if(isAttacker) {
            className += " conflict-attacker";
        }
        if(contested && conflict.attackerWins !== isAttacker) {
            className += " conflict-losing";
        }
        return className;
    };

    const defender = otherIsAttacker ? thisPlayer : otherPlayer;
    const provinces = conflictProvinces(otherIsAttacker || otherIsDefender ? defender : undefined);
    const conflictClass = `icon-${conflict.type} conflict-${conflict.type} icon-medium skill-symbol`;

    return (
        <div>
            <div className="conflict-panel">
                <div className={ skillClass(otherIsAttacker) }>{ otherPlayerSkill }</div>
                <div className="phase-display conflict-separator">vs</div>
                <div className={ skillClass(!otherIsAttacker) }>{ thisPlayerSkill }</div>
            </div>
            <div className="conflict-panel">
                <div className="phase-display">
                    <span className={ conflictClass } >&nbsp;</span>
                    { conflict.elements && conflict.elements.includes("fire") && <span className="icon-element-fire">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("water") && <span className="icon-element-water">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("earth") && <span className="icon-element-earth">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("air") && <span className="icon-element-air">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("void") && <span className="icon-element-void" /> }
                </div>
            </div>
            { provinces.length > 0 ? (
                <div
                    className={ `conflict-panel conflict-province${conflict.breaking ? " breaking" : ""}` }
                    title={ conflict.breaking ? "Province strength: the province breaks if the attacker wins like this" : "Province strength" }
                >
                    <div className="phase-display">{ provinces.map((province) => province.strengthSummary?.stat).join(" / ") }</div>
                    <div className="conflict-province-label">{ conflict.breaking ? "breaks" : "province" }</div>
                </div>
            ) : null }
        </div>
    );
}
