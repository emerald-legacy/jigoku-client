import { Plus, Minus } from "lucide-react";
import Avatar from "../Avatar";
import Clock from "./Clock";
import type { ClockState, Player } from "../types/game";

interface PlayerStatsRowProps {
    clockState?: ClockState | null;
    firstPlayer?: boolean;
    handSize?: number;
    otherPlayer?: boolean;
    sendGameMessage: (message: string, ...args: unknown[]) => void;
    showControls?: boolean;
    spectating?: boolean;
    stats?: Record<string, number>;
    user?: Player["user"] | null;
}

export function PlayerStatsRow({
    clockState,
    firstPlayer,
    handSize,
    otherPlayer,
    sendGameMessage,
    showControls,
    spectating,
    stats,
    user
}: PlayerStatsRowProps) {
    const sendUpdate = (type: string, direction: string) => {
        sendGameMessage("changeStat", type, direction === "up" ? 1 : -1);
    };

    const getStatValueOrDefault = (stat: string) => {
        if(!stats) {
            return 0;
        }
        return stats[stat] || 0;
    };

    const getButton = (stat: string, name: string, statToSet = stat) => {
        const imageStyle = { backgroundImage: `url(/img/${name}.png)` };

        return (
            <div className="state">
                { showControls && (
                    <button
                        className="btn btn-stat"
                        onClick={ () => sendUpdate(statToSet, "down") }
                    >
                        <Minus size={ 16 } strokeWidth={ 3 } aria-label="-" />
                    </button>
                ) }
                <div className="stat-image" style={ imageStyle }>
                    <div className="stat-value">{ getStatValueOrDefault(stat) }</div>
                </div>
                { showControls && (
                    <button
                        className="btn btn-stat"
                        onClick={ () => sendUpdate(statToSet, "up") }
                    >
                        <Plus size={ 16 } strokeWidth={ 3 } aria-label="+" />
                    </button>
                ) }
            </div>
        );
    };

    const playerAvatar = (
        <div className="player-avatar state">
            <Avatar emailHash={ user ? user.emailHash : "unknown" } />
            <b>{ user ? user.username : "Noone" }</b>
        </div>
    );

    const clock =
        !clockState || clockState.mode === "off" ? null : (
            <div className="state">
                <Clock
                    secondsLeft={ clockState.timeLeft }
                    mode={ clockState.mode }
                    stateId={ clockState.stateId }
                />
            </div>
        );

    return (
        <div className="panel player-stats no-highlight">
            { playerAvatar }
            { getButton("fate", "Fate") }
            { getButton("honor", "Honor") }
            { firstPlayer && (
                <div className="state first-player-state">
                    <img
                        className="first-player-indicator"
                        src="/img/first-player.png"
                        title="First Player"
                    />
                </div>
            ) }
            { (otherPlayer || spectating) && (
                <div className="state">
                    <div className="hand-size">Hand Size: { handSize }</div>
                </div>
            ) }
            <div className="state">
                <div className="conflicts-remaining">
                    Conflicts Remaining: { getStatValueOrDefault("conflictsRemaining") }
                    { getStatValueOrDefault("politicalRemaining") > 0 ? (
                        <span className="icon-political" />
                    ) : null }
                    { getStatValueOrDefault("politicalRemaining") > 1 ? (
                        <span className="icon-political" />
                    ) : null }
                    { getStatValueOrDefault("militaryRemaining") > 0 ? (
                        <span className="icon-military" />
                    ) : null }
                    { getStatValueOrDefault("militaryRemaining") > 1 ? (
                        <span className="icon-military" />
                    ) : null }
                </div>
            </div>
            { clock }
        </div>
    );
}

PlayerStatsRow.displayName = "PlayerStatsRow";

export default PlayerStatsRow;
