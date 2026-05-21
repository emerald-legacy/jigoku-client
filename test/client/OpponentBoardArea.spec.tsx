import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const dynastySpy = vi.fn();
const strongholdSpy = vi.fn();

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

import OpponentBoardArea from "../../client/GameComponents/OpponentBoardArea";

describe("the <OpponentBoardArea /> component", () => {
    let baseProps: any;
    let otherPlayer: any;

    beforeEach(() => {
        dynastySpy.mockClear();
        strongholdSpy.mockClear();
        otherPlayer = {
            name: "Opp",
            cardPiles: {
                hand: [],
                conflictDiscardPile: [],
                conflictDeck: [],
                dynastyDiscardPile: [],
                dynastyDeck: [],
                removedFromGame: []
            },
            provinces: { one: [{ uuid: "p1" }], two: [], three: [], four: [] },
            strongholdProvince: [{ uuid: "sh" }],
            numConflictCards: 5,
            numDynastyCards: 7,
            role: { uuid: "role" },
            conflictDeckTopCard: null,
            dynastyDeckTopCard: null
        };
        baseProps = {
            otherPlayer,
            otherPlayerCards: [<div key="row" data-testid="card-row">opp-cards</div>],
            cardSize: "normal",
            gameMode: "stronghold",
            skirmishMode: false,
            onCardClick: vi.fn(),
            onMouseOver: vi.fn(),
            onMouseOut: vi.fn(),
            onMenuItemClick: vi.fn()
        };
    });

    it("renders dynasty row, stronghold row, and the supplied card rows", () => {
        render(<OpponentBoardArea { ...baseProps } />);
        expect(screen.getByTestId("dynasty-row")).toBeInTheDocument();
        expect(screen.getByTestId("stronghold-row")).toBeInTheDocument();
        expect(screen.getByTestId("card-row")).toBeInTheDocument();
    });

    it("passes the opponent's province data through to DynastyRow", () => {
        render(<OpponentBoardArea { ...baseProps } />);
        const props = dynastySpy.mock.calls[0][0];
        expect(props.province1Cards).toBe(otherPlayer.provinces.one);
        expect(props.numConflictCards).toBe(5);
        expect(props.numDynastyCards).toBe(7);
    });

    it("flags skirmish mode when gameMode is Skirmish", () => {
        baseProps.gameMode = "skirmish";
        render(<OpponentBoardArea { ...baseProps } />);
        expect(dynastySpy.mock.calls[0][0].isSkirmish).toBe(true);
        expect(strongholdSpy.mock.calls[0][0].isSkirmish).toBe(true);
    });

    it("falls back to empty piles when otherPlayer is missing", () => {
        baseProps.otherPlayer = undefined;
        render(<OpponentBoardArea { ...baseProps } />);
        const props = dynastySpy.mock.calls[0][0];
        expect(props.province1Cards).toEqual([]);
        expect(props.numConflictCards).toBe(0);
        expect(props.numDynastyCards).toBe(0);
    });
});
