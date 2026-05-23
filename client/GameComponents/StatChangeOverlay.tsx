import React from "react";
import type { AnimationEvent } from "../types/redux";

interface StatChangeOverlayProps {
    animations: AnimationEvent[];
    onDismiss: () => void;
}

type StatChange = {
    kind: "honor" | "fate";
    playerName: string;
    amount: number;
    icon: string;
};

const StatChangeOverlay: React.FC<StatChangeOverlayProps> = ({ animations, onDismiss }) => {
    const changes: StatChange[] = animations
        .filter((a): a is (Extract<AnimationEvent, { type: "honor" }> | Extract<AnimationEvent, { type: "fate" }>) =>
            a.type === "honor" || a.type === "fate"
        )
        .map(a => ({
            kind: a.type,
            playerName: a.playerName,
            amount: a.amount,
            icon: a.type === "honor" ? "/img/Honor.png" : "/img/Fate.png"
        }));

    if(changes.length === 0) {
        return null;
    }

    return (
        <div className="stat-change-overlay" onAnimationEnd={ onDismiss }>
            { changes.map((change, i) => (
                <div key={ i } className="stat-change-card">
                    <div className="stat-change-name">{ change.playerName }</div>
                    <div className={ `stat-change-amount ${ change.amount > 0 ? "gain" : "lose" }` }>
                        { change.amount > 0 ? `+${change.amount}` : `${change.amount}` }
                        <img src={ change.icon } className="stat-change-icon" alt={ change.kind } />
                    </div>
                </div>
            )) }
        </div>
    );
};

StatChangeOverlay.displayName = "StatChangeOverlay";

export default StatChangeOverlay;
