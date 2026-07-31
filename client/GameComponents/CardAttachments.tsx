import React from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Card from "./Card";
import { startCardDrag } from "./cardDrag";
import { PLAY_EXIT_MS } from "./PlayAreaCard";
import type { Card as CardType, MenuItem } from "../types/game";

const ATTACHABLE_SOURCES = new Set(["play area", "province 1", "province 2", "province 3", "province 4", "stronghold province"]);

function offsetsFor(size?: string) {
    let attachmentOffset = 13;
    let cardHeight = 84;
    const cardLayer = 45;
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
        case "xxl":
            attachmentOffset *= 2.5;
            cardHeight *= 2.5;
            break;
    }
    return { attachmentOffset, cardHeight, cardLayer };
}

type AttachmentCardProps = {
    in?: boolean;
    onExited?: (node?: HTMLElement) => void;
    appear?: boolean;
    enter?: boolean;
    exit?: boolean;
} & React.ComponentProps<typeof Card>;

// Attachments animate out in place, so each one owns the node ref its transition needs.
function AttachmentCard({ in: inProp, onExited, appear, enter, exit, ...cardProps }: AttachmentCardProps) {
    const nodeRef = React.useRef<HTMLDivElement>(null);

    return (
        <CSSTransition
            in={ inProp }
            onExited={ onExited }
            appear={ appear }
            enter={ enter }
            exit={ exit }
            timeout={ PLAY_EXIT_MS }
            classNames="play-card"
            nodeRef={ nodeRef }
        >
            <div ref={ nodeRef } style={ { display: "contents" } }>
                <Card { ...cardProps } />
            </div>
        </CSSTransition>
    );
}

interface CardAttachmentsProps {
    attachments?: CardType[];
    source?: string;
    size?: string;
    disableMouseOver?: boolean;
    onMouseOver?: ((card: CardType) => void) | null;
    onMouseOut?: ((card?: CardType) => void) | null;
    onClick?: (card: CardType) => void;
    onMenuItemClick?: (card: CardType, menuItem: MenuItem) => void;
}

export default function CardAttachments(props: CardAttachmentsProps) {
    const { attachments, source, size, disableMouseOver, onMouseOver, onMouseOut, onClick, onMenuItemClick } = props;
    const visibleAttachments = attachments ?? [];

    if(!source || !ATTACHABLE_SOURCES.has(source)) {
        return null;
    }
    if(visibleAttachments.length === 0) {
        return null;
    }

    const { attachmentOffset, cardHeight, cardLayer } = offsetsFor(size);

    return (
        <TransitionGroup component={ null }>
            { visibleAttachments.map((attachment: CardType, i: number) => {
                const index = i + 1;
                return (
                    <AttachmentCard
                        key={ attachment.uuid }
                        id={ attachment.uuid }
                        source={ source }
                        card={ attachment }
                        className="attachment"
                        wrapped={ false }
                        style={ {
                            marginLeft: `${-1 * (index * attachmentOffset)}px`,
                            marginTop: `${-1 * cardHeight - attachmentOffset * (attachment.bowed ? 1 : 0)}px`,
                            zIndex: (cardLayer - index)
                        } }
                        onMouseOver={ disableMouseOver ? null : (onMouseOver as (card: CardType) => void) }
                        onMouseOut={ disableMouseOver ? null : (onMouseOut as () => void) }
                        onClick={ onClick }
                        onMenuItemClick={ onMenuItemClick }
                        onDragStart={ (ev: React.DragEvent<HTMLElement>) => startCardDrag(ev, attachment, source) }
                        size={ size }
                    />
                );
            }) }
        </TransitionGroup>
    );
}
