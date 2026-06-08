import { Plus, Minus } from "lucide-react";
import Clock from "./Clock";
import ClockPopup from "./ClockPopup";
import { resolveFateImage, resolveHonorImage, resolveFirstPlayerImage } from "../boardCosmetics";
import { usePatronViewerConfig } from "../PatronContext";
import { asset } from "../assetUrl";
import type { ClockState, Player } from "../types/game";
import type { AnimationEvent } from "../types/redux";

interface PlayerStatsBoxProps {
    clockState?: ClockState | null;
    firstPlayer?: boolean;
    handSize?: number;
    otherPlayer?: boolean;
    sendGameMessage?: (message: string, ...args: unknown[]) => void;
    showControls?: boolean;
    size?: string;
    spectating?: boolean;
    stats?: Record<string, number> | null;
    user?: Player["user"] | null;
    pendingAnimations?: AnimationEvent[];
    playerName?: string;
    onAnimationEnd?: (playerName: string) => void;
}

export function PlayerStatsBox({
    clockState,
    firstPlayer,
    handSize,
    otherPlayer,
    sendGameMessage,
    showControls,
    size,
    stats,
    pendingAnimations,
    playerName,
    onAnimationEnd
}: PlayerStatsBoxProps) {
    const viewer = usePatronViewerConfig();
    const fateImage = resolveFateImage(viewer);
    const honorImage = resolveHonorImage(viewer);
    const firstPlayerImage = resolveFirstPlayerImage(viewer);

    const airAnim = pendingAnimations?.find(a => a.type === "air" && a.playerName === playerName);
    const sendUpdate = (type: string, direction: string) => {
        sendGameMessage?.("changeStat", type, direction === "up" ? 1 : -1);
    };

    const getStatValueOrDefault = (stat: string) => {
        if(!stats) {
            return 0;
        }
        return stats[stat] || 0;
    };

    const getButton = (stat: string, name: string, statToSet = stat, image = asset(`${name}.png`)) => {
        const imageStyle = { backgroundImage: `url(${image})` };

        return (
            <div className="state">
                { showControls && (
                    <button
                        className={ `btn btn-stat ${size}` }
                        onClick={ () => sendUpdate(statToSet, "down") }
                    >
                        <Minus size={ 16 } strokeWidth={ 3 } aria-label="-" />
                    </button>
                ) }
                <div className={ `stat-image ${size}` } style={ imageStyle } />
                <div>:</div>
                <div className="stat-value">{ getStatValueOrDefault(stat) }</div>
                { showControls && (
                    <button
                        className={ `btn btn-stat ${size}` }
                        onClick={ () => sendUpdate(statToSet, "up") }
                    >
                        <Plus size={ 16 } strokeWidth={ 3 } aria-label="+" />
                    </button>
                ) }
            </div>
        );
    };

    const handImageStyle = { backgroundImage: `url(${asset("conflictcard.png")})` };

    const clock =
        !clockState || clockState.mode === "off" ? null : (
            <div className="state clock-frame">
                <Clock
                    delayToStartClock={ clockState.delayToStartClock }
                    manuallyPaused={ clockState.manuallyPaused }
                    secondsLeft={ clockState.timeLeft }
                    mode={ clockState.mode }
                    stateId={ clockState.stateId }
                    periods={ clockState.periods }
                    mainTime={ clockState.mainTime }
                    timePeriod={ clockState.timePeriod }
                />
                <ClockPopup
                    mainTime={ clockState.mainTime }
                    periods={ clockState.periods }
                    timePeriod={ clockState.timePeriod }
                    clockName={ clockState.name }
                />
            </div>
        );

    return (
        <div
            className={ `player-stats${otherPlayer ? "" : " our-side"}${airAnim ? " ring-effect-air" : ""}` }
            onAnimationEnd={ airAnim && onAnimationEnd && playerName ? () => onAnimationEnd(playerName) : undefined }
        >
            <div className="stats-row">
                <div className="state first-player-state">
                    <img
                        className={ `first-player-indicator${firstPlayer ? "" : " hidden"}` }
                        src={ firstPlayerImage }
                        title="First Player"
                    />
                </div>
            </div>
            <div className="stats-row">{ clock }</div>
            <div className="stats-row">
                <div className="state">
                    <div className="conflicts-remaining">
                        Conflicts: { getStatValueOrDefault("conflictsRemaining") }
                        <div>
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
                </div>
            </div>
            <div className="player-stats__resources">
                <div className="stats-row">
                    <div className="state">
                        <div className={ `stat-image ${size}` } style={ handImageStyle } />
                        <div>:</div>
                        <div className="stat-value">{ handSize }</div>
                    </div>
                </div>
                <div className="stats-row">{ getButton("fate", "Fate", "fate", fateImage) }</div>
                <div className="stats-row">{ getButton("honor", "Honor", "honor", honorImage) }</div>
            </div>
        </div>
    );
}

PlayerStatsBox.displayName = "PlayerStatsBox";

export default PlayerStatsBox;
