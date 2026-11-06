import React from "react";
import { asset } from "../assetUrl";
import type { Player, ConflictInfo } from "../types/game";

export default function CardsPlayedTracker({ conflict, thisPlayer, otherPlayer }: { conflict: ConflictInfo; thisPlayer: Player; otherPlayer?: Player }) {
    if(!conflict.attackingPlayerId) {
        return null;
    }
    const handImageStyle = { backgroundImage: `url(${asset("conflictcard.png")})` };
    // A dimmed card icon and a "played" label, so the count isn't read as the hand size (same icon, full strength)
    const row = (modifier: string, title: string, count: number) => (
        <div className={ `cards-played-tracker cards-played-tracker--${modifier}` } title={ title }>
            <div className="stat-image cards-played-tracker__icon" style={ handImageStyle } />
            <div className="cards-played-tracker__count">{ count }</div>
            <div className="cards-played-tracker__label" aria-hidden="true">played</div>
        </div>
    );
    return (
        <div className="cards-played-tracker__container">
            { row("opponent", "Cards your opponent played this conflict", (otherPlayer && otherPlayer.cardsPlayedThisConflict) || 0) }
            { row("me", "Cards you played this conflict", thisPlayer.cardsPlayedThisConflict || 0) }
        </div>
    );
}
