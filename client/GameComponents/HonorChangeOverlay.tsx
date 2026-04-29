import React from "react";
import type { AnimationEvent } from "../types/redux";

interface HonorChangeOverlayProps {
    animations: AnimationEvent[];
    onDismiss: () => void;
}

const HonorChangeOverlay: React.FC<HonorChangeOverlayProps> = ({ animations, onDismiss }) => {
    const honorAnims = animations.filter(a => a.type === "honor") as Array<{ type: "honor"; playerName: string; amount: number }>;

    if(honorAnims.length === 0) {
        return null;
    }

    return (
        <div className="honor-change-overlay" onAnimationEnd={ onDismiss }>
            { honorAnims.map((anim, i) => (
                <div key={ i } className="honor-change-card">
                    <div className="honor-change-name">{ anim.playerName }</div>
                    <div className={ `honor-change-amount ${ anim.amount > 0 ? "gain" : "lose" }` }>
                        { anim.amount > 0 ? `+${anim.amount}` : `${anim.amount}` }
                        <img src="/img/Honor.png" className="honor-change-icon" alt="honor" />
                    </div>
                </div>
            )) }
        </div>
    );
};

HonorChangeOverlay.displayName = "HonorChangeOverlay";

export default HonorChangeOverlay;
