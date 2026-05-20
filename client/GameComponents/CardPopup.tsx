import React from "react";
import { X } from "lucide-react";
import Card from "./Card";
import type { Card as CardType } from "../types/game";

interface CardPopupProps {
    attachments?: CardType[];
    title?: string;
    popupLocation?: string;
    orientation?: string;
    isMe?: boolean;
    source?: string;
    size?: string;
    disableMouseOver?: boolean;
    onCloseClick: (event: React.MouseEvent) => void;
    onCardClick: (card: CardType) => void;
    onSelectCard: () => void;
    onMouseOver?: ((card: CardType) => void) | null;
    onMouseOut?: ((card?: CardType) => void) | null;
    onDragDrop?: (card: CardType, source: string, target: string) => void;
}

export default function CardPopup(props: CardPopupProps) {
    const {
        attachments,
        title,
        popupLocation,
        orientation,
        isMe,
        source,
        size,
        disableMouseOver,
        onCloseClick,
        onCardClick,
        onSelectCard,
        onMouseOver,
        onMouseOut,
        onDragDrop
    } = props;

    let cardIndex = 0;
    const cardList = (attachments || []).map((attachmentCard: CardType) => {
        let cardKey: string | number = cardIndex++;
        let displayCard: CardType = attachmentCard;
        if(!isMe) {
            displayCard = { facedown: true, isDynasty: attachmentCard.isDynasty, isConflict: attachmentCard.isConflict } as CardType;
        } else {
            cardKey = attachmentCard.uuid;
        }
        return (
            <Card
                key={ cardKey }
                card={ displayCard }
                source={ source }
                disableMouseOver={ disableMouseOver || !isMe }
                onMouseOver={ onMouseOver }
                onMouseOut={ onMouseOut }
                onClick={ () => onCardClick(displayCard) }
                onDragDrop={ onDragDrop }
                orientation={ orientation === "bowed" ? "vertical" : orientation }
                size={ size }
            />
        );
    });

    let popupClass = "panel";
    let arrowClass = "arrow lg";
    if(popupLocation === "top") {
        popupClass += " our-side";
        arrowClass += " down";
    } else {
        arrowClass += " up";
    }
    if(orientation === "horizontal") {
        arrowClass = "arrow lg left";
    }

    return (
        <div className="popup">
            <div className="panel-title" onClick={ event => event.stopPropagation() }>
                <span className="text-center">{ title }</span>
                <span className="pull-right">
                    <a className="close-button" onClick={ onCloseClick }><X size={ 16 } /></a>
                </span>
            </div>
            <div className={ popupClass } onClick={ event => event.stopPropagation() }>
                <div>
                    <a className="btn btn-default" onClick={ onSelectCard }>Select Card</a>
                </div>
                <div className="inner">
                    { cardList }
                </div>
                <div className={ arrowClass } />
            </div>
        </div>
    );
}
