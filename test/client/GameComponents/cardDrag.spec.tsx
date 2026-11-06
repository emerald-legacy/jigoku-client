import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";

import { useCardTouchDrag } from "../../../client/GameComponents/cardDrag";
import type { Card as CardType } from "../../../client/types/game";

const card = { uuid: "card-1", name: "Test Card" } as CardType;

function DraggableCard({ onDragDrop }: { onDragDrop: (card: CardType, source: string, target: string) => void }) {
    const handlers = useCardTouchDrag(card, "hand", onDragDrop);
    return (
        <>
            <div data-testid="card" { ...handlers } />
            <div data-testid="pile" data-drop-target="conflict discard pile"><span data-testid="pile-inner" /></div>
        </>
    );
}

const at = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }], changedTouches: [{ clientX: x, clientY: y }] });

describe("useCardTouchDrag", () => {
    let onDragDrop: ReturnType<typeof vi.fn>;
    let cardElement: HTMLElement;
    let originalElementsFromPoint: typeof document.elementsFromPoint;

    beforeEach(() => {
        onDragDrop = vi.fn();
        const { getByTestId } = render(<DraggableCard onDragDrop={ onDragDrop } />);
        cardElement = getByTestId("card");
        originalElementsFromPoint = document.elementsFromPoint;
        // The dragged card is under the finger first, then the pile's content.
        document.elementsFromPoint = () => [cardElement, getByTestId("pile-inner")];
    });

    afterEach(() => {
        document.elementsFromPoint = originalElementsFromPoint;
    });

    const touchEnd = (x: number, y: number) => {
        const event = new TouchEvent("touchend", { bubbles: true, cancelable: true, changedTouches: [{ clientX: x, clientY: y } as Touch] });
        cardElement.dispatchEvent(event);
        return event;
    };

    it("drops the card on the target under the finger, and cancels the click", () => {
        fireEvent.touchStart(cardElement, at(10, 10));
        fireEvent.touchMove(cardElement, at(100, 80));
        expect(cardElement.style.position).toBe("fixed");

        const end = touchEnd(100, 80);

        expect(onDragDrop).toHaveBeenCalledWith(card, "hand", "conflict discard pile");
        expect(end.defaultPrevented).toBe(true);
        expect(cardElement.style.position).toBe("");
    });

    it("treats a touch that barely moves as a tap", () => {
        fireEvent.touchStart(cardElement, at(10, 10));
        fireEvent.touchMove(cardElement, at(14, 12));

        const end = touchEnd(14, 12);

        expect(onDragDrop).not.toHaveBeenCalled();
        expect(end.defaultPrevented).toBe(false);
        expect(cardElement.style.position).toBe("");
    });

    it("drops nothing when no target is under the finger", () => {
        document.elementsFromPoint = () => [cardElement];
        fireEvent.touchStart(cardElement, at(10, 10));
        fireEvent.touchMove(cardElement, at(200, 200));

        touchEnd(200, 200);

        expect(onDragDrop).not.toHaveBeenCalled();
        expect(cardElement.style.position).toBe("");
    });
});
