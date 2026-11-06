import { useRef } from "react";
import type React from "react";
import type { Card as CardType } from "../types/game";

export function startCardDrag(event: React.DragEvent<HTMLElement>, card: CardType, source: string | undefined) {
    event.dataTransfer.setData("Text", JSON.stringify({ card, source }));
}

const dragThreshold = 10;

/** The drop target under a point (provinces, card piles, the hand and the play area carry `data-drop-target`), ignoring the dragged card. */
function findDropTarget(x: number, y: number, dragged: Element): string | undefined {
    for(const element of document.elementsFromPoint(x, y)) {
        if(dragged.contains(element)) {
            continue;
        }
        const target = element.closest<HTMLElement>("[data-drop-target]");
        if(target) {
            return target.dataset.dropTarget;
        }
    }
    return undefined;
}

interface CardTouchDragHandlers {
    onTouchStart: (event: React.TouchEvent<HTMLElement>) => void;
    onTouchMove: (event: React.TouchEvent<HTMLElement>) => void;
    onTouchEnd: (event: React.TouchEvent<HTMLElement>) => void;
}

/**
 * Drag and drop by touch: the card follows the finger once it moved more than a few pixels, and is dropped on the
 * target under the finger, the same targets as mouse drag and drop. A touch that doesn't move stays a tap.
 * The page can't scroll from a draggable card (`touch-action: none` in cards.css), so the drag isn't also a scroll.
 */
export function useCardTouchDrag(
    card: CardType,
    source: string | undefined,
    onDragDrop?: (card: CardType, source: string, target: string) => void
): CardTouchDragHandlers {
    const dragRef = useRef<{ offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean } | null>(null);

    const resetPosition = (element: HTMLElement) => {
        element.style.position = "";
        element.style.left = "";
        element.style.top = "";
        element.style.zIndex = "";
    };

    const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
        const touch = event.touches[0];
        if(event.touches.length !== 1 || !touch) {
            dragRef.current = null;
            return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top, startX: touch.clientX, startY: touch.clientY, moved: false };
    };

    const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
        const drag = dragRef.current;
        const touch = event.touches[0];
        if(!drag || !touch) {
            return;
        }
        if(!drag.moved && Math.hypot(touch.clientX - drag.startX, touch.clientY - drag.startY) <= dragThreshold) {
            return;
        }
        drag.moved = true;
        const target = event.currentTarget;
        target.style.position = "fixed";
        target.style.left = `${touch.clientX - drag.offsetX}px`;
        target.style.top = `${touch.clientY - drag.offsetY}px`;
        target.style.zIndex = "var(--layer-top)";
    };

    const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
        const drag = dragRef.current;
        dragRef.current = null;
        if(!drag?.moved) {
            return;
        }
        // A drag is not a tap: no click on the card afterwards.
        event.preventDefault();
        const target = event.currentTarget;
        const touch = event.changedTouches[0];
        const dropTarget = touch ? findDropTarget(touch.clientX, touch.clientY, target) : undefined;
        resetPosition(target);
        if(dropTarget && source && onDragDrop) {
            onDragDrop(card, source, dropTarget);
        }
    };

    return { onTouchStart, onTouchMove, onTouchEnd };
}
