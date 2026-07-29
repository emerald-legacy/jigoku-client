import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("../../../client/GameComponents/Card.tsx", () => ({
    default: ({ card }: any) => <div data-testid={ `card-${card?.uuid ?? "none"}` } />
}));

import DynastyRow from "../../../client/GameComponents/DynastyRow";

const card = (uuid: string) => ({ uuid, name: `Card ${uuid}`, type: "character" });

const dropCardOn = (element: Element, dragged = card("dragged")) => {
    fireEvent.drop(element, {
        dataTransfer: {
            getData: () => JSON.stringify({ card: dragged, source: "hand" })
        }
    });
};

// The row itself has no drop handlers: each pile and province owns its own drop target and calls
// the onDragDrop passed down here. This is what keeps manual-mode drags working.
describe("the <DynastyRow /> drop targets", () => {
    let onDragDrop: ReturnType<typeof vi.fn>;
    let baseProps: any;

    beforeEach(() => {
        onDragDrop = vi.fn();
        baseProps = {
            isMe: true,
            manualMode: true,
            cardSize: "normal",
            conflictDeck: [],
            conflictDiscardPile: [card("cd1")],
            dynastyDeck: [],
            dynastyDiscardPile: [card("dd1")],
            numConflictCards: 0,
            numDynastyCards: 0,
            province1Cards: [],
            province2Cards: [],
            province3Cards: [],
            province4Cards: [],
            removedFromGame: [],
            onDragDrop,
            onCardClick: vi.fn(),
            onMenuItemClick: vi.fn(),
            onMouseOver: vi.fn(),
            onMouseOut: vi.fn(),
            onConflictClick: vi.fn(),
            onDynastyClick: vi.fn(),
            onConflictShuffleClick: vi.fn(),
            onDynastyShuffleClick: vi.fn()
        };
    });

    const pileByHeader = (container: HTMLElement, header: string) => {
        const headers = Array.from(container.querySelectorAll(".panel-header"));
        const match = headers.find(h => h.textContent?.includes(header));
        expect(match, `no pile titled ${header}`).toBeTruthy();
        return match!.parentElement!;
    };

    it("should accept a card dropped on the dynasty discard pile", () => {
        const { container } = render(<DynastyRow { ...baseProps } />);

        dropCardOn(pileByHeader(container, "Dynasty Discard"));

        expect(onDragDrop).toHaveBeenCalledTimes(1);
        expect(onDragDrop).toHaveBeenCalledWith(expect.objectContaining({ uuid: "dragged" }), "hand", "dynasty discard pile");
    });

    it("should accept a card dropped on the conflict discard pile", () => {
        const { container } = render(<DynastyRow { ...baseProps } />);

        dropCardOn(pileByHeader(container, "Conflict Discard"));

        expect(onDragDrop).toHaveBeenCalledWith(expect.objectContaining({ uuid: "dragged" }), "hand", "conflict discard pile");
    });

    it("should accept a card dropped on the dynasty deck", () => {
        const { container } = render(<DynastyRow { ...baseProps } />);

        dropCardOn(pileByHeader(container, "Dynasty"));

        expect(onDragDrop).toHaveBeenCalled();
    });

    it("should accept a card dropped on a province", () => {
        const { container } = render(<DynastyRow { ...baseProps } />);
        const province = container.querySelector(".province");
        expect(province).toBeTruthy();

        dropCardOn(province!);

        expect(onDragDrop).toHaveBeenCalled();
    });

    it("should ignore a drop carrying no card data", () => {
        const { container } = render(<DynastyRow { ...baseProps } />);

        fireEvent.drop(pileByHeader(container, "Dynasty Discard"), {
            dataTransfer: { getData: () => "" }
        });

        expect(onDragDrop).not.toHaveBeenCalled();
    });
});
