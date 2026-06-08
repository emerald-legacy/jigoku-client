import React from "react";
import Avatar from "../Avatar";
import HonorFan from "./HonorFan";
import PlayerStatsBox from "./PlayerStatsBox";
import { RingRow } from "./CenterBar";
import { resolveDialSet, resolveOwnedRingsPatron } from "../boardCosmetics";
import { usePatronViewerConfig, usePatronOwnerStatus } from "../PatronContext";
import type { Player, Ring as RingType, MenuItem, GameState } from "../types/game";
import type { AnimationEvent } from "../types/redux";

interface PlayerSidebarProps {
    thisPlayer: Player;
    otherPlayer?: Player;
    cardSize: string;
    showRingEffects?: boolean;
    gameMode?: string;
    rings: GameState["rings"];
    spectating: boolean;
    manualMode: boolean;
    boundActions: Record<string, (...args: unknown[]) => unknown>;
    onRingClick: (ring: string) => void;
    onRingMenuItemClick: (ring: RingType, menuItem: MenuItem) => void;
    pendingAnimations?: AnimationEvent[];
    onAnimationEnd?: (playerName: string) => void;
}

export default function PlayerSidebar(props: PlayerSidebarProps) {
    const { thisPlayer, otherPlayer, cardSize, showRingEffects, gameMode, rings, spectating, manualMode, boundActions, pendingAnimations, onAnimationEnd } = props;
    const viewer = usePatronViewerConfig();
    const thisIsPatron = usePatronOwnerStatus(thisPlayer.user?.username);
    const otherIsPatron = usePatronOwnerStatus(otherPlayer?.user?.username);
    return (
        <div className={ `province-pane ${cardSize}` }>
            <div className="player-nameplate">
                <Avatar emailHash={ otherPlayer && otherPlayer.user ? otherPlayer.user.emailHash : "unknown" } />
                <div className="player-name">
                    { otherPlayer && otherPlayer.user ? otherPlayer.user.username : "Noone" }
                </div>
            </div>
            <div className={ `sidebar-pane their-side ${cardSize}` }>
                { thisPlayer.hideProvinceDeck && <HonorFan size={ cardSize } value={ otherPlayer?.showBid ?? 0 } dialSet={ resolveDialSet(otherPlayer?.user?.settings?.patron?.dial, otherIsPatron) } /> }
                <RingRow
                    rings={ rings }
                    owner={ otherPlayer ? otherPlayer.name : "\0" }
                    cardSize={ cardSize }
                    showRingEffects={ showRingEffects }
                    gameMode={ gameMode }
                    onClick={ props.onRingClick }
                    onMenuItemClick={ props.onRingMenuItemClick }
                    removed={ false }
                    className={ `claimed-pool their-pool ${cardSize || ""}` }
                    patron={ resolveOwnedRingsPatron(otherIsPatron, viewer) }
                />
                <div className="sidebar-pane their-side">
                    <PlayerStatsBox
                        clockState={ otherPlayer ? otherPlayer.clock : null }
                        stats={ otherPlayer ? otherPlayer.stats : null }
                        user={ otherPlayer ? otherPlayer.user : null }
                        firstPlayer={ otherPlayer && otherPlayer.firstPlayer }
                        handSize={ otherPlayer && otherPlayer.cardPiles.hand ? otherPlayer.cardPiles.hand.length : 0 }
                        otherPlayer
                        size={ cardSize }
                        pendingAnimations={ pendingAnimations }
                        playerName={ otherPlayer?.name }
                        onAnimationEnd={ onAnimationEnd }
                    />
                </div>
            </div>
            <div className="sidebar-pane our-side">
                <PlayerStatsBox
                    { ...boundActions }
                    clockState={ thisPlayer.clock }
                    stats={ thisPlayer.stats }
                    showControls={ !spectating && manualMode }
                    user={ thisPlayer.user }
                    firstPlayer={ thisPlayer.firstPlayer }
                    otherPlayer={ false }
                    spectating={ spectating }
                    size={ cardSize }
                    handSize={ thisPlayer.cardPiles.hand ? thisPlayer.cardPiles.hand.length : 0 }
                    pendingAnimations={ pendingAnimations }
                    playerName={ thisPlayer.name }
                    onAnimationEnd={ onAnimationEnd }
                />
                <RingRow
                    rings={ rings }
                    owner={ thisPlayer ? thisPlayer.name : "\0" }
                    cardSize={ cardSize }
                    showRingEffects={ showRingEffects }
                    gameMode={ gameMode }
                    onClick={ props.onRingClick }
                    onMenuItemClick={ props.onRingMenuItemClick }
                    removed={ false }
                    className={ `claimed-pool my-pool ${cardSize || ""}` }
                    patron={ resolveOwnedRingsPatron(thisIsPatron, viewer) }
                />
                { thisPlayer.hideProvinceDeck && <HonorFan size={ cardSize } value={ thisPlayer.showBid ?? 0 } dialSet={ resolveDialSet(thisPlayer.user?.settings?.patron?.dial, thisIsPatron) } /> }
            </div>
            <div className="player-nameplate our-side">
                <Avatar emailHash={ thisPlayer.user ? thisPlayer.user.emailHash : "unknown" } />
                <div className="player-name">
                    { thisPlayer.user ? thisPlayer.user.username : "Noone" }
                </div>
            </div>
        </div>
    );
}
