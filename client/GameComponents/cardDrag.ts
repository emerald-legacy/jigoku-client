import { useState } from "react";
import type React from "react";
import type { Card as CardType } from "../types/game";

export function startCardDrag(event: React.DragEvent<HTMLElement>, card: CardType, source: string | undefined) {
    event.dataTransfer.setData("Text", JSON.stringify({ card, source }));
}

function findNearestElement(element: Element, selector: string): Element | null {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const candidates = document.querySelectorAll(selector);
    let nearest: Element | null = null;
    let minDistance = Infinity;

    candidates.forEach((candidate: Element) => {
        if(candidate === element || candidate.contains(element)) {
            return;
        }
        const candidateRect = candidate.getBoundingClientRect();
        const candidateCenterX = candidateRect.left + candidateRect.width / 2;
        const candidateCenterY = candidateRect.top + candidateRect.height / 2;
        const distance = Math.sqrt(
            Math.pow(centerX - candidateCenterX, 2) +
            Math.pow(centerY - candidateCenterY, 2)
        );
        if(distance < minDistance) {
            minDistance = distance;
            nearest = candidate;
        }
    });

    return nearest;
}

interface CardTouchDragHandlers {
    onTouchStart: (event: React.TouchEvent<HTMLElement>) => void;
    onTouchMove: (event: React.TouchEvent<HTMLElement>) => void;
    onTouchEnd: (event: React.TouchEvent<HTMLElement>) => void;
}

export function useCardTouchDrag(
    card: CardType,
    source: string | undefined,
    onDragDrop?: (card: CardType, source: string, target: string) => void
): CardTouchDragHandlers {
    const [touchStart, setTouchStart] = useState<{ left: number; top: number } | null>(null);

    const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setTouchStart({ left: rect.left, top: rect.top });
    };

    const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
        event.preventDefault();
        const touch = event.targetTouches[0];
        const target = event.currentTarget as HTMLElement;
        target.style.left = `${touch.screenX - 32}px`;
        target.style.top = `${touch.screenY - 42}px`;
        target.style.position = "fixed";
    };

    const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const targetRect = target.getBoundingClientRect();
        const nearestPile = findNearestElement(target, ".card-pile, .hand, .player-board");

        if(!nearestPile) {
            return;
        }

        const pileRect = nearestPile.getBoundingClientRect();

        if(touchStart && targetRect.left === touchStart.left && targetRect.top === touchStart.top) {
            return;
        }

        if(targetRect.left + targetRect.width > pileRect.left - 10 && targetRect.left < pileRect.left + pileRect.width + 10) {
            let dropTarget = "";
            const pileClasses = nearestPile.className || "";

            if(pileClasses.includes("hand")) {
                dropTarget = "hand";
            } else if(pileClasses.includes("player-board")) {
                dropTarget = "play area";
            }

            if(dropTarget && onDragDrop) {
                onDragDrop(card, source, dropTarget);
            }
        }

        if(touchStart) {
            target.style.left = `${touchStart.left}px`;
            target.style.top = `${touchStart.top}px`;
        }
        event.currentTarget.style.position = "initial";
    };

    return { onTouchStart, onTouchMove, onTouchEnd };
}
