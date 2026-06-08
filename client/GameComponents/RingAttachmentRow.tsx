import React from "react";
import Card from "./Card";
import { asset } from "../assetUrl";
import type { Card as CardType, MenuItem } from "../types/game";

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

export default function RingAttachmentRow({ element, attachments, amController, cardSize, onCardClick, onDragDrop, onMenuItemClick, onMouseOver, onMouseOut }: {
    element: string;
    attachments: CardType[];
    amController: boolean;
    cardSize: string;
    onCardClick: (card: CardType) => void;
    onDragDrop: (card: CardType, source: string, target: string) => void;
    onMenuItemClick: (card: CardType, menuItem: MenuItem) => void;
    onMouseOver: (card: CardType) => void;
    onMouseOut: () => void;
}) {
    if(!attachments.length) {
        return null;
    }
    const attachmentOffset = attachmentOffsetFor(cardSize);
    const cardLayer = 45;
    return (
        <div id={ `ring-attachments-${element}` } className="ring-attachments--element" style={ { marginLeft: `${(attachments.length - 1) * attachmentOffset}px` } } >
            <img className="ring-attachments__ring-symbol" src={ asset(`military-${element}.png`) } />
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
