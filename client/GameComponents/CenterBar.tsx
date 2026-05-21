import React from "react";
import Ring from "./Ring";
import Card from "./Card";
import type { Card as CardType, Ring as RingType, Player, MenuItem, GameState } from "../types/game";

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
    onMouseOver: (card: any) => void;
    onMouseOut: () => void;
}

function attachmentOffsetFor(cardSize: string) {
    const base = 13 * 0.8;
    switch(cardSize) {
        case "large":
            return base * 1.4;
        case "small":
            return base * 0.8;
        case "x-large":
            return base * 2;
        default:
            return base;
    }
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

export function RingRow({ rings, owner, cardSize, showRingEffects, gameMode, onClick, onMenuItemClick, removed, className }: {
    rings: GameState["rings"];
    owner: string | null;
    cardSize: string;
    showRingEffects?: boolean;
    gameMode?: string;
    onClick: (ring: string) => void;
    onMenuItemClick: (ring: RingType, menuItem: MenuItem) => void;
    removed: boolean;
    className: string;
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
                    />
                );
            }) }
        </div>
    );
}

function ConflictPanel({ conflict, otherPlayer }: { conflict: any; otherPlayer?: Player }) {
    if(!conflict.attackingPlayerId) {
        return <div />;
    }

    let thisPlayerSkill: number | string = "-";
    let otherPlayerSkill: number | string = "-";
    if(otherPlayer && otherPlayer.id.includes(conflict.attackingPlayerId)) {
        otherPlayerSkill = (conflict.attackerSkill !== undefined) ? conflict.attackerSkill : "-";
        thisPlayerSkill = (conflict.defenderSkill !== undefined && !conflict.unopposed) ? conflict.defenderSkill : "-";
    } else if(otherPlayer && otherPlayer.id.includes(conflict.defendingPlayerId)) {
        otherPlayerSkill = (conflict.defenderSkill !== undefined && !conflict.unopposed) ? conflict.defenderSkill : "-";
        thisPlayerSkill = (conflict.attackerSkill !== undefined) ? conflict.attackerSkill : "-";
    } else {
        thisPlayerSkill = (conflict.attackerSkill !== undefined) ? conflict.attackerSkill : "-";
    }
    const conflictClass = `icon-${conflict.type} conflict-${conflict.type} icon-medium skill-symbol`;

    return (
        <div>
            <div className="conflict-panel">
                <div className="phase-display conflict-count-top">{ otherPlayerSkill }</div>
                <div className="phase-display conflict-separator">vs</div>
                <div className="phase-display conflict-count-bottom">{ thisPlayerSkill }</div>
            </div>
            <div className="conflict-panel">
                <div className="phase-display">
                    <span className={ conflictClass } >&nbsp;</span>
                    { conflict.elements && conflict.elements.includes("fire") && <span className="icon-element-fire">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("water") && <span className="icon-element-water">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("earth") && <span className="icon-element-earth">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("air") && <span className="icon-element-air">&nbsp;</span> }
                    { conflict.elements && conflict.elements.includes("void") && <span className="icon-element-void" /> }
                </div>
            </div>
        </div>
    );
}

function CardsPlayedTracker({ conflict, thisPlayer, otherPlayer }: { conflict: any; thisPlayer: Player; otherPlayer?: Player }) {
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

function RingAttachmentRow({ element, attachments, amController, cardSize, onCardClick, onDragDrop, onMenuItemClick, onMouseOver, onMouseOut }: {
    element: string;
    attachments: CardType[];
    amController: boolean;
    cardSize: string;
    onCardClick: (card: CardType) => void;
    onDragDrop: (card: CardType, source: string, target: string) => void;
    onMenuItemClick: (card: CardType, menuItem: MenuItem) => void;
    onMouseOver: (card: any) => void;
    onMouseOut: () => void;
}) {
    if(!attachments.length) {
        return null;
    }
    const attachmentOffset = attachmentOffsetFor(cardSize);
    const cardLayer = 45;
    return (
        <div id={ `ring-attachments-${element}` } className="ring-attachments--element" style={ { marginLeft: `${(attachments.length - 1) * attachmentOffset}px` } } >
            <img className="ring-attachments__ring-symbol" src={ `/img/military-${element}.png` } />
            { attachments.map((card: CardType, index: number) => (
                <div key={ card.uuid } className={ index !== 0 ? "ring-attachment--stacked" : "ring-attachment" } style={ { marginLeft: `${-1 * (index * attachmentOffset)}px`, zIndex: (cardLayer - index) } }>
                    <Card
                        source="play area"
                        card={ card }
                        disableMouseOver={ card.facedown && !card.code }
                        onMenuItemClick={ onMenuItemClick }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        showStats={ false }
                        onClick={ onCardClick }
                        onDragDrop={ onDragDrop }
                        size={ cardSize }
                        isMe={ amController }
                    />
                </div>
            )) }
        </div>
    );
}

export default function CenterBar(props: CenterBarProps) {
    const { currentGame, thisPlayer, otherPlayer, cardSize, showRingEffects } = props;
    const rings = currentGame.rings;
    const anyRemoved = rings.air.removedFromGame || rings.earth.removedFromGame || rings.water.removedFromGame || rings.fire.removedFromGame || rings.void.removedFromGame;
    const gameMode = currentGame.gameMode;
    const conflict = currentGame.conflict;

    const opponentRingAttachments: Record<string, CardType[]> = otherPlayer && rings ? getControlledRingAttachments(Object.values<RingType>(rings), otherPlayer) : {};
    const playerRingAttachments: Record<string, CardType[]> = thisPlayer && rings ? getControlledRingAttachments(Object.values<RingType>(rings), thisPlayer) : {};

    return (
        <div className="center-bar">
            <RingRow rings={ rings } owner={ null } cardSize={ cardSize } showRingEffects={ showRingEffects } gameMode={ gameMode } onClick={ props.onRingClick } onMenuItemClick={ props.onRingMenuItemClick } removed={ false } className="ring-panel" />
            { anyRemoved
                ? <RingRow rings={ rings } owner={ null } cardSize={ cardSize } showRingEffects={ showRingEffects } gameMode={ gameMode } onClick={ props.onRingClick } onMenuItemClick={ props.onRingMenuItemClick } removed className="ring-panel removed-rings" />
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
