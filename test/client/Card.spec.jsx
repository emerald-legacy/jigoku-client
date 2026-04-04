import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock jQuery and its plugins before importing the component
vi.mock("jquery", () => {
    const mockJQuery = vi.fn(() => ({
        offset: vi.fn(() => ({ left: 0, top: 0 })),
        width: vi.fn(() => 100),
        height: vi.fn(() => 100),
        nearest: vi.fn(() => []),
        css: vi.fn(),
        attr: vi.fn(() => ""),
        addClass: vi.fn(),
        removeClass: vi.fn()
    }));
    mockJQuery.fn = { jquery: "3.6.0" };
    return { default: mockJQuery };
});

vi.mock("jquery-migrate", () => ({ default: {} }));
vi.mock("jquery-nearest", () => ({ default: {} }));

// Mock child components
vi.mock("../../client/GameComponents/CardMenu.jsx", () => ({
    default: ({ menu }) => menu ? <div data-testid="card-menu">Menu</div> : null
}));

vi.mock("../../client/GameComponents/CardStats.jsx", () => ({
    default: () => <div data-testid="card-stats">Stats</div>
}));

vi.mock("../../client/GameComponents/CardCounters.jsx", () => ({
    default: ({ counters }) => <div data-testid="card-counters">{ JSON.stringify(counters) }</div>
}));

vi.mock("../../client/GameComponents/CardPile.jsx", () => ({
    default: ({ title }) => <div data-testid="card-pile">{ title }</div>
}));

import Card from "../../client/GameComponents/Card.jsx";

describe("the <Card /> component", () => {
    let card;
    let onMouseOver;
    let onMouseOut;
    let onClick;

    beforeEach(() => {
        card = {
            id: "test-card-1",
            name: "Test Card",
            uuid: "abc-123",
            type: "character"
        };

        onMouseOver = vi.fn();
        onMouseOut = vi.fn();
        onClick = vi.fn();
    });

    describe("when initially rendered with empty card", () => {
        beforeEach(() => {
            render(<Card card={ {} } source="hand" />);
        });

        it("should show a facedown card with a card back rendered", () => {
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.src).toContain("/img/cards/cardback.png");
        });
    });

    describe("when rendered with a card", () => {
        beforeEach(() => {
            render(<Card card={ card } source="hand" />);
        });

        it("should show the card image", () => {
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.src).toContain("/img/cards/test-card-1");
        });

        it("should show the card name", () => {
            expect(screen.getByText("Test Card")).toBeInTheDocument();
        });
    });

    describe("that is selected", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, selected: true } } source="hand" />);
        });

        it("should mark the card as selected", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("selected");
        });
    });

    describe("that is selected and also new", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, selected: true, new: true } } source="hand" />);
        });

        it("should flag as selected and not new (selected takes priority)", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("selected");
            expect(cardElement.className).not.toContain("new");
        });
    });

    describe("that is new", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, new: true } } source="hand" />);
        });

        it("should mark the card as new", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("new");
        });
    });

    describe("that is facedown", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, facedown: true } } source="hand" />);
        });

        it("should show a facedown image", () => {
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.src).not.toContain("/img/cards/test-card-1");
            expect(cardImage.src).toContain("/img/cards/cardback.png");
        });
    });

    describe("that is bowed", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, bowed: true } } source="hand" />);
        });

        it("should add the bowed styling to the card", () => {
            const cardElement = document.querySelector(".card");
            const cardImage = document.querySelector(".card-image");

            expect(cardElement.className).toContain("horizontal");
            expect(cardElement.className).not.toContain("vertical");
            expect(cardImage.className).toContain("vertical");
            expect(cardImage.className).toContain("bowed");
        });
    });

    describe("that is broken (province)", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, isBroken: true, type: "province" } } source="province 1" />);
        });

        it("should add the broken styling to the card image", () => {
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.className).toContain("broken");
        });
    });

    describe("that is selectable", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, selectable: true } } source="hand" />);
        });

        it("should mark the card as selectable", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("selectable");
        });
    });

    describe("that is in danger", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, inDanger: true } } source="hand" />);
        });

        it("should mark the card as in-danger", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("in-danger");
        });
    });

    describe("that is in conflict", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, inConflict: true } } source="play area" />);
        });

        it("should mark the card as in conflict", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("conflict");
        });
    });

    describe("mouse over events", () => {
        describe("when mouseover is disabled", () => {
            beforeEach(() => {
                render(
                    <Card
                        card={ card }
                        source="hand"
                        disableMouseOver
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                    />
                );
            });

            it("should not call the mouse over handler", () => {
                const cardDiv = document.querySelector(".card");
                fireEvent.mouseOver(cardDiv);
                expect(onMouseOver).not.toHaveBeenCalled();
            });
        });

        describe("when mouseover is not disabled", () => {
            beforeEach(() => {
                render(
                    <Card
                        card={ card }
                        source="hand"
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                    />
                );
            });

            it("should call the mouse over handler", () => {
                const cardDiv = document.querySelector(".card");
                fireEvent.mouseOver(cardDiv);
                expect(onMouseOver).toHaveBeenCalledWith(card);
            });

            it("should call the mouse out handler", () => {
                const cardDiv = document.querySelector(".card");
                fireEvent.mouseOut(cardDiv);
                expect(onMouseOut).toHaveBeenCalled();
            });
        });
    });

    describe("click events", () => {
        beforeEach(() => {
            render(
                <Card
                    card={ card }
                    source="hand"
                    onClick={ onClick }
                />
            );
        });

        it("should call onClick when card is clicked", () => {
            const cardDiv = document.querySelector(".card");
            fireEvent.click(cardDiv);
            expect(onClick).toHaveBeenCalledWith(card);
        });
    });

    describe("card back based on card type", () => {
        it("should use conflict card back for conflict cards", () => {
            render(<Card card={ { ...card, facedown: true, isConflict: true } } source="conflict deck" />);
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.src).toContain("conflictcardback.png");
        });

        it("should use dynasty card back for dynasty cards", () => {
            render(<Card card={ { ...card, facedown: true, isDynasty: true } } source="dynasty deck" />);
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.src).toContain("dynastycardback.png");
        });

        it("should use province card back for province cards", () => {
            render(<Card card={ { ...card, facedown: true, isProvince: true } } source="province deck" />);
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.src).toContain("provincecardback.png");
        });
    });

    describe("card size classes", () => {
        it("should add large class when size is large", () => {
            render(<Card card={ card } source="hand" size="large" />);
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("large");
        });

        it("should add small class when size is small", () => {
            render(<Card card={ card } source="hand" size="small" />);
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("small");
        });

        it("should add x-large class when size is x-large", () => {
            render(<Card card={ card } source="hand" size="x-large" />);
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("x-large");
        });
    });

    describe("card with packId", () => {
        it("should include packId in the image path", () => {
            render(<Card card={ { ...card, packId: "core" } } source="hand" />);
            const cardImage = document.querySelector(".card-image");
            expect(cardImage.src).toContain("/img/cards/test-card-1-core.jpg");
        });
    });
});
