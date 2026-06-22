import React from "react";
import Ring from "./Ring";
import type { Ring as RingType, MenuItem, GameState } from "../types/game";
import type { AnimationEvent } from "../types/redux";

export default function RingRow({ rings, owner, cardSize, showRingEffects, gameMode, onClick, onMenuItemClick, removed, className, ringSet, pendingAnimations, onClaimAnimationEnd }: {
    rings: GameState["rings"];
    owner: string | null;
    cardSize: string;
    showRingEffects?: boolean;
    gameMode?: string;
    onClick: (ring: string) => void;
    onMenuItemClick: (ring: RingType, menuItem: MenuItem) => void;
    removed: boolean;
    className: string;
    ringSet?: string;
    pendingAnimations?: AnimationEvent[];
    onClaimAnimationEnd?: (element: string, playerName: string) => void;
}) {
    const elements: Array<keyof GameState["rings"]> = ["air", "earth", "fire", "void", "water"];
    return (
        <div className={ className }>
            { elements.map((element: keyof GameState["rings"]) => {
                const ring = rings[element];
                const shouldShow = removed ? ring.removedFromGame : !ring.removedFromGame;
                if(!shouldShow) {
                    return null;
                }
                return (
                    <Ring
                        key={ element }
                        owner={ owner }
                        ring={ ring }
                        onClick={ onClick }
                        size={ cardSize }
                        onMenuItemClick={ onMenuItemClick }
                        showRingEffects={ showRingEffects }
                        gameMode={ gameMode }
                        ringSet={ ringSet }
                        pendingAnimations={ pendingAnimations }
                        onClaimAnimationEnd={ onClaimAnimationEnd }
                    />
                );
            }) }
        </div>
    );
}
