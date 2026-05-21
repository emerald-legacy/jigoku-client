import React from "react";
import type { AnimationEvent } from "../types/redux";

interface HonorChangeOverlayProps {
    animations: AnimationEvent[];
    onDismiss: () => void;
}

type StatChange = {
    kind: "honor" | "fate";
    playerName: string;
    amount: number;
    icon: string;
};

const HonorChangeOverlay: React.FC<HonorChangeOverlayProps> = ({ animations, onDismiss }) => {
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
        <div className="honor-change-overlay" onAnimationEnd={ onDismiss }>
            { changes.map((change, i) => (
                <div key={ i } className="honor-change-card">
                    <div className="honor-change-name">{ change.playerName }</div>
                    <div className={ `honor-change-amount ${ change.amount > 0 ? "gain" : "lose" }` }>
                        { change.amount > 0 ? `+${change.amount}` : `${change.amount}` }
                        <img src={ change.icon } className="honor-change-icon" alt={ change.kind } />
                    </div>
                </div>
            )) }
        </div>
    );
};

HonorChangeOverlay.displayName = "HonorChangeOverlay";

export default HonorChangeOverlay;
