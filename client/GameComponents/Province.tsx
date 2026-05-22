import React, { memo } from "react";

import Card from "./Card";
import { tryParseJSON } from "../util";
import type { Card as CardType, MenuItem } from "../types/game";

interface ProvinceProps {
    cards?: CardType[];
    cardCount?: number;
    dynastyCard?: CardType[];
    hiddenDynastyCard?: boolean;
    hiddenProvinceCard?: boolean;
    isMe?: boolean;
    onCardClick?: (card: CardType) => void;
    onDragDrop?: (card: CardType, source: string, target: string) => void;
    onMenuItemClick?: (card: CardType, menuItem: MenuItem) => void;
    onMouseOut?: (card: CardType) => void;
    onMouseOver?: (card: CardType) => void;
    orientation?: string;
    popupLocation?: string;
    provinceCard?: CardType;
    size?: string;
    source?: string;
    strongholdCard?: CardType;
    title?: string;
}

function Province({
    cards,
    cardCount,
    dynastyCard,
    hiddenDynastyCard,
    hiddenProvinceCard,
    isMe,
    onCardClick,
    onDragDrop,
    onMenuItemClick,
    onMouseOut,
    onMouseOver,
    orientation = "vertical",
    popupLocation,
    provinceCard: propsProvinceCard,
    size,
    source,
    strongholdCard: propsStrongholdCard,
    title
}: ProvinceProps) {
    const onDragOver = (event: React.DragEvent<HTMLElement>) => {
        (event.target as HTMLElement).classList.add("highlight-panel");
        event.preventDefault();
    };

    const onDragLeave = (event: React.DragEvent<HTMLElement>) => {
        (event.target as HTMLElement).classList.remove("highlight-panel");
    };

    const handleDragDrop = (event: React.DragEvent<HTMLElement>, target: string | undefined) => {
        event.stopPropagation();
        event.preventDefault();

        (event.target as HTMLElement).classList.remove("highlight-panel");

        const card = event.dataTransfer.getData("Text");

        if(!card) {
            return;
        }

        const dragData = tryParseJSON(card);

        if(!dragData) {
            return;
        }

        if(onDragDrop) {
            onDragDrop(dragData.card, dragData.source, target);
        }
    };

    const getWrapperStyle = (provinceCard: CardType) => {
        let wrapperStyle = {};
        let attachmentOffset = 13;
        let cardHeight = 84;
        switch(size) {
            case "large":
                attachmentOffset *= 1.4;
                cardHeight *= 1.4;
                break;
            case "small":
                attachmentOffset *= 0.8;
                cardHeight *= 0.8;
                break;
            case "x-large":
                attachmentOffset *= 2;
                cardHeight *= 2;
                break;
        }

        const attachments = provinceCard.attachments || [];
        const attachmentCount = attachments.length;
        let totalTiers = 0;
        for(const attachment of attachments) {
            if(attachment.bowed) {
                totalTiers += 1;
            }
        }

        if(attachmentCount > 0) {
            wrapperStyle = {
                marginLeft: `${4 + attachmentCount * attachmentOffset}px`,
                minHeight: `${cardHeight + totalTiers * attachmentOffset}px`
            };
        }

        return wrapperStyle;
    };

    let className = `panel province ${size}`;
    const displayCardCount = cardCount || (cards ? cards.length : "0");
    const headerText = title ? `${title} (${displayCardCount})` : "";

    let provinceCard =
        propsProvinceCard || cards?.find((card: CardType) => card.isProvince);
    let dynastyCards =
        dynastyCard || cards?.filter((card: CardType) => card.isDynasty) || [];
    const strongholdCard =
        propsStrongholdCard || cards?.find((card: CardType) => card.isStronghold);

    if(hiddenProvinceCard && provinceCard) {
        provinceCard = { ...provinceCard, facedown: true };
    }

    if(hiddenDynastyCard && dynastyCards.length > 0) {
        dynastyCards = dynastyCards.map((card: CardType) => ({ ...card, facedown: true }));
    }

    let cardClassName = "";
    if(provinceCard) {
        cardClassName = "province-attachment";
    }

    if(size !== "normal") {
        cardClassName += ` ${size}`;
    }

    if(orientation === "horizontal" || orientation === "bowed") {
        className += " horizontal";
    } else {
        className += " vertical";
    }

    return (
        <div
            className={ className }
            onDragLeave={ onDragLeave }
            onDragOver={ onDragOver }
            onDrop={ (event) => handleDragDrop(event, source) }
            style={ provinceCard ? { ...getWrapperStyle(provinceCard) } : {} }
        >
            <div className="panel-header">{ headerText }</div>
            { provinceCard ? (
                <Card
                    id={ provinceCard.uuid }
                    card={ provinceCard }
                    source={ source }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    onClick={ onCardClick }
                    onMenuItemClick={ onMenuItemClick }
                    onDragDrop={ onDragDrop }
                    size={ size }
                />
            ) : null }
            { dynastyCards.length > 0
                ? dynastyCards.map((card: CardType) => {
                    return (
                        <Card
                            id={ card.uuid }
                            className={ cardClassName }
                            card={ card }
                            source={ source }
                            popupLocation={ popupLocation }
                            isMe={ isMe }
                            key={ card.uuid }
                            onMouseOver={ onMouseOver }
                            onMouseOut={ onMouseOut }
                            disableMouseOver={ card.facedown && !card.id }
                            onClick={ onCardClick }
                            onMenuItemClick={ onMenuItemClick }
                            onDragDrop={ onDragDrop }
                            size={ size }
                        />
                    );
                })
                : null }
            { strongholdCard ? (
                <Card
                    id={ strongholdCard.uuid }
                    className={ cardClassName }
                    card={ strongholdCard }
                    source={ source }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    disableMouseOver={ strongholdCard.facedown }
                    onClick={ onCardClick }
                    onMenuItemClick={ onMenuItemClick }
                    isMe={ !!isMe }
                    onDragDrop={ onDragDrop }
                    size={ size }
                />
            ) : null }
        </div>
    );
}

Province.displayName = "Province";

export default memo(Province);
