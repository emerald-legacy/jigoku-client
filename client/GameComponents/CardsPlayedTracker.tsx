import React from "react";
import type { Player, ConflictInfo } from "../types/game";

export default function CardsPlayedTracker({ conflict, thisPlayer, otherPlayer }: { conflict: ConflictInfo; thisPlayer: Player; otherPlayer?: Player }) {
    if(!conflict.attackingPlayerId) {
        return null;
    }
    const handImageStyle = { backgroundImage: "url(/img/conflictcard.png)" };
    return (
        <div className="cards-played-tracker__container">
            <div className="cards-played-tracker cards-played-tracker--opponent">
                <div className="stat-image undefined" style={ handImageStyle } />
                <div className="cards-played-tracker__count" >{ (otherPlayer && otherPlayer.cardsPlayedThisConflict) || 0 }</div>
            </div>
            <div className="cards-played-tracker cards-played-tracker--me">
                <div className="stat-image undefined" style={ handImageStyle } />
                <div className="cards-played-tracker__count" >{ thisPlayer.cardsPlayedThisConflict || 0 }</div>
            </div>
        </div>
    );
}
