import React from "react";
import type { Player, ConflictInfo } from "../types/game";

export default function ConflictPanel({ conflict, otherPlayer }: { conflict: ConflictInfo; otherPlayer?: Player }) {
    if(!conflict.attackingPlayerId) {
        return <div />;
    }

    let thisPlayerSkill: number | string = "-";
    let otherPlayerSkill: number | string = "-";
    if(otherPlayer && otherPlayer.id && otherPlayer.id.includes(conflict.attackingPlayerId)) {
        otherPlayerSkill = (conflict.attackerSkill !== undefined) ? conflict.attackerSkill : "-";
        thisPlayerSkill = (conflict.defenderSkill !== undefined && !conflict.unopposed) ? conflict.defenderSkill : "-";
    } else if(otherPlayer && otherPlayer.id && conflict.defendingPlayerId && otherPlayer.id.includes(conflict.defendingPlayerId)) {
        otherPlayerSkill = (conflict.defenderSkill !== undefined && !conflict.unopposed) ? conflict.defenderSkill : "-";
        thisPlayerSkill = (conflict.attackerSkill !== undefined) ? conflict.attackerSkill : "-";
    } else {
        thisPlayerSkill = (conflict.attackerSkill !== undefined) ? conflict.attackerSkill : "-";
    }
    const conflictClass = `icon-${conflict.type} conflict-${conflict.type} icon-medium skill-symbol`;

    return (
        <div>
            <div className="conflict-panel">
                <div className="phase-display conflict-count-top">{ otherPlayerSkill }</div>
                <div className="phase-display conflict-separator">vs</div>
                <div className="phase-display conflict-count-bottom">{ thisPlayerSkill }</div>
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
        </div>
    );
}
