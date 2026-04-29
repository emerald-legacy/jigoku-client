import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Card from "./Card.jsx";
import { tryParseJSON } from "../util";

const EMPTY_STYLE = {};

interface PlayerHandProps {
    cardSize?: string;
    cards: any[];
    isMe?: boolean;
    onAnimationEnd?: (id: string) => void;
    onCardClick?: (card: any) => void;
    onDragDrop?: (card: any, source: string, target: string) => void;
    onMouseOut?: (card: any) => void;
    onMouseOver?: (card: any) => void;
    pendingAnimations?: any[];
    playerName?: string;
}

function PlayerHand({ cardSize, cards, isMe, onAnimationEnd, onCardClick, onDragDrop, onMouseOut, onMouseOver, pendingAnimations, playerName }: PlayerHandProps) {
    const handleDragOver = (event: React.DragEvent) => {
        (event.target as HTMLElement).classList.add("highlight-panel");
        event.preventDefault();
    };

    const handleDragLeave = (event: React.DragEvent) => {
        (event.target as HTMLElement).classList.remove("highlight-panel");
    };

    const handleDragDrop = (event: React.DragEvent, target: string) => {
        event.stopPropagation();
        event.preventDefault();

        (event.target as HTMLElement).classList.remove("highlight-panel");

        const cardData = event.dataTransfer.getData("Text");

        if(!cardData) {
            return;
        }

        const dragData = tryParseJSON(cardData);
        if(!dragData) {
            return;
        }

        if(onDragDrop) {
            onDragDrop(dragData.card, dragData.source, target);
        }
    };

    const getCardWidth = () => {
        switch(cardSize) {
            case "small":
                return 65 * 0.8;
            case "large":
                return 65 * 1.4;
            case "x-large":
                return 65 * 2;
            case "normal":
            default:
                return 65;
        }
    };

    const cardWidth = getCardWidth();

    let maxWidth: number;
    switch(cardSize) {
        case "small":
        case "large":
        case "x-large":
        case "xxl":
            maxWidth = cardWidth * 7.5;
            break;
        default:
            maxWidth = 480;
    }

    const needsSquish = cards && cards.length * cardWidth > maxWidth;

    const handCards = (() => {
        const handLength = cards ? cards.length : 0;
        let cardIndex = 1;
        let attachmentOffset = 13;

        switch(cardSize) {
            case "large":
                attachmentOffset *= 1.4;
                break;
            case "small":
                attachmentOffset *= 0.8;
                break;
            case "x-large":
                attachmentOffset *= 2;
                break;
        }

        return cards?.map((card, index) => {
            let className = "";
            if(needsSquish) {
                className += " squish";
                if(cardIndex++ === handLength) {
                    className += " tail";
                    if(attachmentOffset > (480 / (cardWidth * handLength))) {
                        className += " nohide";
                    }
                }
            }

            const nodeRef = React.createRef<HTMLDivElement>();
            const staggerDelay = `${index * 40}ms`;
            return (
                <CSSTransition key={ card.uuid } timeout={ 300 + index * 40 } classNames="hand-card" nodeRef={ nodeRef }>
                    <div ref={ nodeRef } style={ { display: 'contents', '--hand-stagger-delay': staggerDelay } as React.CSSProperties }>
                        <Card
                            card={ card }
                            className={ className }
                            style={ EMPTY_STYLE }
                            disableMouseOver={ !isMe }
                            source="hand"
                            onMouseOver={ onMouseOver }
                            onMouseOut={ onMouseOut }
                            onClick={ onCardClick }
                            onDragDrop={ onDragDrop }
                            size={ cardSize }
                        />
                    </div>
                </CSSTransition>
            );
        }) || [];
    })();

    let className = "panel hand";
    let titleBarClassName = "hand-title-bar no-highlight";

    if(cardSize !== "normal") {
        className += ` ${cardSize}`;
        titleBarClassName += ` ${cardSize}`;
    }

    const earthAnim = pendingAnimations?.find(a => a.type === 'earth' && a.playerName === playerName);
    if(earthAnim) {
        className += ' ring-effect-earth';
    }

    // Calculate dynamic width based on number of cards
    let handWidth = maxWidth;
    if(cards && !needsSquish) {
        handWidth = Math.max(cardWidth * cards.length, cardWidth);
    }

    if(needsSquish) {
        className += " squish";
    }

    const handStyle = { width: `${handWidth}px` };
    const titleBarStyle = { width: `${handWidth}px` };

    return (
        <div>
            <div className="grip">
                <div className={ titleBarClassName } style={ titleBarStyle }>
                    { `Hand (${handCards.length})` }
                </div>
            </div>
            <TransitionGroup
                component="div"
                className={ className }
                style={ handStyle }
                onDragLeave={ handleDragLeave }
                onDragOver={ handleDragOver }
                onDrop={ (event) => handleDragDrop(event as React.DragEvent, "hand") }
                onAnimationEnd={ earthAnim && onAnimationEnd ? () => onAnimationEnd(playerName!) : undefined }
            >
                { handCards }
            </TransitionGroup>
        </div>
    );
}

PlayerHand.displayName = "PlayerHand";

export default PlayerHand;
