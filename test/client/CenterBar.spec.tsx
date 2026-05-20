import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const ringSpy = vi.fn();
const cardSpy = vi.fn();

vi.mock("../../client/GameComponents/Ring.tsx", () => ({
    default: (props: any) => {
        ringSpy(props);
        return (
            <button
                data-testid={ `ring-${props.ring.element}` }
                data-owner={ props.owner ?? "" }
                onClick={ () => props.onClick(props.ring.element) }
            >
                { props.ring.element }
            </button>
        );
    }
}));

vi.mock("../../client/GameComponents/Card.tsx", () => ({
    default: (props: any) => {
        cardSpy(props);
        return <div data-testid="card">{ props.card.name }</div>;
    }
}));

import CenterBar from "../../client/GameComponents/CenterBar";

describe("the <CenterBar /> component", () => {
    let baseProps: any;
    let rings: any;

    beforeEach(() => {
        ringSpy.mockClear();
        cardSpy.mockClear();
        rings = {
            air: { element: "air", removedFromGame: false, attachments: [] },
            earth: { element: "earth", removedFromGame: false, attachments: [] },
            fire: { element: "fire", removedFromGame: false, attachments: [] },
            void: { element: "void", removedFromGame: false, attachments: [] },
            water: { element: "water", removedFromGame: false, attachments: [] }
        };
        baseProps = {
            currentGame: { rings, conflict: { attackingPlayerId: null }, gameMode: "stronghold" },
            thisPlayer: { name: "Me", id: "me-id", cardsPlayedThisConflict: 0 },
            otherPlayer: { name: "Opp", id: "opp-id", cardsPlayedThisConflict: 0 },
            cardSize: "normal",
            showRingEffects: false,
            onRingClick: vi.fn(),
            onRingMenuItemClick: vi.fn(),
            onCardClick: vi.fn(),
            onDragDrop: vi.fn(),
            onMenuItemClick: vi.fn(),
            onMouseOver: vi.fn(),
            onMouseOut: vi.fn()
        };
    });

    describe("rendering rings", () => {
        it("renders the five active rings", () => {
            render(<CenterBar { ...baseProps } />);
            ["air", "earth", "fire", "void", "water"].forEach((e: string) => {
                expect(screen.getByTestId(`ring-${e}`)).toBeInTheDocument();
            });
        });

        it("omits the removed-rings panel when no ring is removed", () => {
            const { container } = render(<CenterBar { ...baseProps } />);
            expect(container.querySelector(".removed-rings")).toBeNull();
        });

        it("renders a separate removed-rings panel when a ring is out of play", () => {
            rings.fire.removedFromGame = true;
            const { container } = render(<CenterBar { ...baseProps } />);
            const removed = container.querySelector(".removed-rings");
            expect(removed).not.toBeNull();
            expect(removed?.querySelector("[data-testid=\"ring-fire\"]")).not.toBeNull();
        });
    });

    describe("ring click contract", () => {
        it("forwards the clicked element to onRingClick", () => {
            render(<CenterBar { ...baseProps } />);
            fireEvent.click(screen.getByTestId("ring-fire"));
            expect(baseProps.onRingClick).toHaveBeenCalledExactlyOnceWith("fire");
        });
    });

    describe("conflict panel", () => {
        it("is not rendered when no conflict is active", () => {
            const { container } = render(<CenterBar { ...baseProps } />);
            expect(container.querySelector(".conflict-panel")).toBeNull();
        });

        it("displays attacker and defender skills when otherPlayer is attacking", () => {
            baseProps.currentGame.conflict = {
                attackingPlayerId: "opp-id",
                defendingPlayerId: "me-id",
                attackerSkill: 7,
                defenderSkill: 3,
                type: "military",
                elements: ["fire"]
            };
            render(<CenterBar { ...baseProps } />);
            expect(screen.getByText("7")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument();
        });

        it("hides defender skill when conflict is unopposed", () => {
            baseProps.currentGame.conflict = {
                attackingPlayerId: "opp-id",
                defendingPlayerId: "me-id",
                attackerSkill: 7,
                defenderSkill: 3,
                unopposed: true,
                type: "military",
                elements: []
            };
            render(<CenterBar { ...baseProps } />);
            expect(screen.getByText("7")).toBeInTheDocument();
            expect(screen.queryByText("3")).toBeNull();
        });
    });

    describe("cards-played tracker", () => {
        it("does not render when no conflict is active", () => {
            const { container } = render(<CenterBar { ...baseProps } />);
            expect(container.querySelector(".cards-played-tracker")).toBeNull();
        });

        it("shows both players' counts during a conflict", () => {
            baseProps.currentGame.conflict = { attackingPlayerId: "me-id", type: "military", elements: [] };
            baseProps.thisPlayer.cardsPlayedThisConflict = 4;
            baseProps.otherPlayer.cardsPlayedThisConflict = 2;
            const { container } = render(<CenterBar { ...baseProps } />);
            const counts = container.querySelectorAll(".cards-played-tracker__count");
            expect(counts).toHaveLength(2);
            expect(counts[0].textContent).toBe("2");
            expect(counts[1].textContent).toBe("4");
        });
    });

    describe("ring attachments", () => {
        it("routes each attachment to the side matching its controller", () => {
            rings.fire.attachments = [
                { uuid: "a1", name: "Ember", controller: { name: "Me" } },
                { uuid: "a2", name: "Spark", controller: { name: "Opp" } }
            ];
            const { container } = render(<CenterBar { ...baseProps } />);
            const mySide = container.querySelector(".ring-attachments--me") as HTMLElement;
            const oppSide = container.querySelector(".ring-attachments--opponent") as HTMLElement;
            expect(mySide.textContent).toContain("Ember");
            expect(mySide.textContent).not.toContain("Spark");
            expect(oppSide.textContent).toContain("Spark");
            expect(oppSide.textContent).not.toContain("Ember");
        });

        it("ignores attachments whose controller matches no player", () => {
            rings.fire.attachments = [
                { uuid: "a3", name: "Drift", controller: { name: "Ghost" } }
            ];
            render(<CenterBar { ...baseProps } />);
            expect(cardSpy).not.toHaveBeenCalled();
        });

        it("renders no attachments when nothing is attached", () => {
            render(<CenterBar { ...baseProps } />);
            expect(cardSpy).not.toHaveBeenCalled();
        });
    });
});
