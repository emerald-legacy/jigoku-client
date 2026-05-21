import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const dynastySpy = vi.fn();
const strongholdSpy = vi.fn();
const cardPileSpy = vi.fn();

vi.mock("../../client/GameComponents/DynastyRow.tsx", () => ({
    default: (props: any) => {
        dynastySpy(props);
        return <div data-testid="dynasty-row" />;
    }
}));

vi.mock("../../client/GameComponents/StrongholdRow.tsx", () => ({
    default: (props: any) => {
        strongholdSpy(props);
        return <div data-testid="stronghold-row" />;
    }
}));

vi.mock("../../client/GameComponents/CardPile.tsx", () => ({
    default: (props: any) => {
        cardPileSpy(props);
        return <div data-testid="province-deck" />;
    }
}));

import MyBoardArea from "../../client/GameComponents/MyBoardArea";

describe("the <MyBoardArea /> component", () => {
    let baseProps: any;
    let thisPlayer: any;

    beforeEach(() => {
        dynastySpy.mockClear();
        strongholdSpy.mockClear();
        cardPileSpy.mockClear();
        thisPlayer = {
            name: "Me",
            cardPiles: {
                hand: [],
                conflictDiscardPile: [],
                conflictDeck: [],
                dynastyDiscardPile: [],
                dynastyDeck: [],
                provinceDeck: [{ uuid: "pd" }],
                removedFromGame: []
            },
            provinces: { one: [], two: [], three: [], four: [] },
            strongholdProvince: [],
            numConflictCards: 0,
            numDynastyCards: 0,
            role: null,
            conflictDeckTopCard: null,
            dynastyDeckTopCard: null,
            hideProvinceDeck: false
        };
        baseProps = {
            thisPlayer,
            thisPlayerCards: [<div key="row" data-testid="my-card-row">me-cards</div>],
            cardSize: "normal",
            spectating: false,
            manualMode: false,
            gameMode: "stronghold",
            skirmishMode: false,
            showConflictDeck: false,
            showDynastyDeck: false,
            onCardClick: vi.fn(),
            onMouseOver: vi.fn(),
            onMouseOut: vi.fn(),
            onMenuItemClick: vi.fn(),
            onDragDrop: vi.fn(),
            onConflictClick: vi.fn(),
            onDynastyClick: vi.fn(),
            onConflictShuffleClick: vi.fn(),
            onDynastyShuffleClick: vi.fn(),
            onDragOver: vi.fn(),
            onDropToPlayArea: vi.fn()
        };
    });

    it("renders the province deck CardPile when hideProvinceDeck is false", () => {
        render(<MyBoardArea { ...baseProps } />);
        expect(screen.getByTestId("province-deck")).toBeInTheDocument();
        expect(cardPileSpy.mock.calls[0][0].source).toBe("province deck");
    });

    it("omits the province deck when the player hides it", () => {
        thisPlayer.hideProvinceDeck = true;
        render(<MyBoardArea { ...baseProps } />);
        expect(screen.queryByTestId("province-deck")).toBeNull();
    });

    it("disables the province deck menu when spectating", () => {
        baseProps.spectating = true;
        render(<MyBoardArea { ...baseProps } />);
        expect(cardPileSpy.mock.calls[0][0].disableMenu).toBe(true);
    });

    it("notifies the caller when the dynasty row signals a conflict shuffle", () => {
        render(<MyBoardArea { ...baseProps } />);
        const dynastyProps = dynastySpy.mock.calls[0][0];
        dynastyProps.onConflictShuffleClick();
        expect(baseProps.onConflictShuffleClick).toHaveBeenCalledOnce();
        expect(baseProps.onDynastyShuffleClick).not.toHaveBeenCalled();
    });

    it("notifies the caller when the dynasty row signals a dynasty shuffle", () => {
        render(<MyBoardArea { ...baseProps } />);
        const dynastyProps = dynastySpy.mock.calls[0][0];
        dynastyProps.onDynastyShuffleClick();
        expect(baseProps.onDynastyShuffleClick).toHaveBeenCalledOnce();
        expect(baseProps.onConflictShuffleClick).not.toHaveBeenCalled();
    });

    it("marks DynastyRow as me when not spectating", () => {
        render(<MyBoardArea { ...baseProps } />);
        expect(dynastySpy.mock.calls[0][0].isMe).toBe(true);
        expect(strongholdSpy.mock.calls[0][0].isMe).toBe(true);
    });

    it("invokes onDropToPlayArea when the play area receives a drop", () => {
        const { container } = render(<MyBoardArea { ...baseProps } />);
        const playArea = container.querySelector(".player-board.our-side") as Element;
        fireEvent.drop(playArea, { dataTransfer: { getData: () => "" } });
        expect(baseProps.onDropToPlayArea).toHaveBeenCalledOnce();
    });
});
