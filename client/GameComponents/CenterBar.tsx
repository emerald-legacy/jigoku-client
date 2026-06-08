import React from "react";
import RingRow from "./RingRow";
import ConflictPanel from "./ConflictPanel";
import CardsPlayedTracker from "./CardsPlayedTracker";
import RingAttachmentRow from "./RingAttachmentRow";
import { resolveCenterRingsPatron } from "../boardCosmetics";
import { usePatronViewerConfig } from "../PatronContext";
import type { Card as CardType, Ring as RingType, Player, MenuItem, GameState, ConflictInfo } from "../types/game";

export { default as RingRow } from "./RingRow";

interface CenterBarProps {
    currentGame: GameState;
    thisPlayer: Player;
    otherPlayer?: Player;
    cardSize: string;
    showRingEffects?: boolean;
    onRingClick: (ring: string) => void;
    onRingMenuItemClick: (ring: RingType, menuItem: MenuItem) => void;
    onCardClick: (card: CardType) => void;
    onDragDrop: (card: CardType, source: string, target: string) => void;
    onMenuItemClick: (card: CardType, menuItem: MenuItem) => void;
    onMouseOver: (card: CardType) => void;
    onMouseOut: () => void;
}

function isControlledByPlayer(card: CardType & { controller?: { name?: string } }, player: Player) {
    return card.controller?.name === player.name;
}

function getControlledRingAttachments(rings: RingType[], player: Player): Record<string, CardType[]> {
    return rings.reduce((acc: Record<string, CardType[]>, ring: RingType & { attachments?: CardType[] }) => {
        acc[ring.element] = (ring.attachments && ring.attachments.filter((card: CardType) => isControlledByPlayer(card, player))) || [];
        return acc;
    }, {});
}

export default function CenterBar(props: CenterBarProps) {
    const { currentGame, thisPlayer, otherPlayer, cardSize, showRingEffects } = props;
    const centerRingsPatron = resolveCenterRingsPatron(usePatronViewerConfig());
    const rings = currentGame.rings as Record<string, RingType>;
    const anyRemoved = rings.air.removedFromGame || rings.earth.removedFromGame || rings.water.removedFromGame || rings.fire.removedFromGame || rings.void.removedFromGame;
    const gameMode = currentGame.gameMode;
    const conflict: ConflictInfo = currentGame.conflict ?? {};

    const opponentRingAttachments: Record<string, CardType[]> = otherPlayer && rings ? getControlledRingAttachments(Object.values<RingType>(rings), otherPlayer) : {};
    const playerRingAttachments: Record<string, CardType[]> = thisPlayer && rings ? getControlledRingAttachments(Object.values<RingType>(rings), thisPlayer) : {};

    return (
        <div className="center-bar">
            { typeof currentGame.roundNumber === "number" ? (
                currentGame.roundNumber > 0 ? (
                    <div className="round-indicator" title={ `Round ${currentGame.roundNumber}` }>
                        <span className="round-indicator-label">Round</span>
                        <span className="round-indicator-number">{ currentGame.roundNumber }</span>
                    </div>
                ) : (
                    <div className="round-indicator round-indicator--setup" title="Setup">
                        <span className="round-indicator-label">Setup</span>
                    </div>
                )
            ) : null }
            <RingRow rings={ rings } owner={ null } cardSize={ cardSize } showRingEffects={ showRingEffects } gameMode={ gameMode } onClick={ props.onRingClick } onMenuItemClick={ props.onRingMenuItemClick } removed={ false } className="ring-panel" patron={ centerRingsPatron } />
            { anyRemoved
                ? <RingRow rings={ rings } owner={ null } cardSize={ cardSize } showRingEffects={ showRingEffects } gameMode={ gameMode } onClick={ props.onRingClick } onMenuItemClick={ props.onRingMenuItemClick } removed className="ring-panel removed-rings" patron={ centerRingsPatron } />
                : null }
            <ConflictPanel conflict={ conflict } otherPlayer={ otherPlayer } />
            <CardsPlayedTracker conflict={ conflict } thisPlayer={ thisPlayer } otherPlayer={ otherPlayer } />
            <div className="ring-attachments__container">
                <div className="ring-attachments__container-inner">
                    <div className="ring-attachments ring-attachments--opponent">
                        { Object.keys(opponentRingAttachments).map((key: string) => (
                            <RingAttachmentRow
                                key={ `opp-${key}` }
                                element={ key }
                                attachments={ opponentRingAttachments[key] }
                                amController
                                cardSize={ cardSize }
                                onCardClick={ props.onCardClick }
                                onDragDrop={ props.onDragDrop }
                                onMenuItemClick={ props.onMenuItemClick }
                                onMouseOver={ props.onMouseOver }
                                onMouseOut={ props.onMouseOut }
                            />
                        )) }
                    </div>
                    <div className="ring-attachments ring-attachments--me">
                        { Object.keys(playerRingAttachments).map((key: string) => (
                            <RingAttachmentRow
                                key={ `me-${key}` }
                                element={ key }
                                attachments={ playerRingAttachments[key] }
                                amController
                                cardSize={ cardSize }
                                onCardClick={ props.onCardClick }
                                onDragDrop={ props.onDragDrop }
                                onMenuItemClick={ props.onMenuItemClick }
                                onMouseOver={ props.onMouseOver }
                                onMouseOut={ props.onMouseOut }
                            />
                        )) }
                    </div>
                </div>
            </div>
        </div>
    );
}
