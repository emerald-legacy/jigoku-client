import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("../../client/GameComponents/CardMenu.tsx", () => ({
    default: ({ menu }) => menu ? <div data-testid="card-menu">Menu</div> : null
}));

vi.mock("../../client/GameComponents/CardStats.tsx", () => ({
    default: () => <div data-testid="card-stats">Stats</div>
}));

vi.mock("../../client/GameComponents/CardCounters.tsx", () => ({
    default: ({ counters }) => <div data-testid="card-counters">{ JSON.stringify(counters) }</div>
}));

vi.mock("../../client/GameComponents/CardPile.tsx", () => ({
    default: ({ title }) => <div data-testid="card-pile">{ title }</div>
}));

const patronState = vi.hoisted(() => ({ promoOwners: {} as Record<string, boolean> }));

vi.mock("../../client/PatronContext", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../client/PatronContext")>();
    return { ...actual, useOwnerShowsPromo: (username?: string | null) => !!(username && patronState.promoOwners[username]) };
});

vi.mock("../../client/assetUrl", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../client/assetUrl")>();
    return {
        ...actual,
        promoArt: (stem: string) => (stem === "promo-card-promo-pack" ? "/assets/promo-card.abc123.webp" : undefined)
    };
});

import Card from "../../client/GameComponents/Card.tsx";

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
        patronState.promoOwners = {};
    });

    describe("when initially rendered with empty card", () => {
        beforeEach(() => {
            render(<Card card={ {} } source="hand" />);
        });

        it("should show a facedown card with a card back rendered", () => {
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("conflictcardback.webp");
        });
    });

    describe("when rendered with a card", () => {
        beforeEach(() => {
            render(<Card card={ card } source="hand" />);
        });

        it("should show the card image", () => {
            const cardImage = document.querySelector(".card-image-src");
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

        it("should flag as both selected and new so the entrance animation can finish", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("selected");
            expect(cardElement.className).toContain("new");
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
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).not.toContain("/img/cards/test-card-1");
            expect(cardImage.src).toContain("conflictcardback.webp");
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
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("conflictcardback.webp");
        });

        it("should use dynasty card back for dynasty cards", () => {
            render(<Card card={ { ...card, facedown: true, isDynasty: true } } source="dynasty deck" />);
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("dynastycardback.webp");
        });

        it("should use province card back for province cards", () => {
            render(<Card card={ { ...card, facedown: true, isProvince: true } } source="province deck" />);
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("provincecardback.webp");
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
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("/img/cards/test-card-1-core.jpg");
        });
    });

    // Promo art is owner-broadcast: Card resolves the card's owner (from card.controller, with a
    // player fallback) and asks useOwnerShowsPromo whether that owner should see promo art. The
    // patron + usePromos decision itself lives in PatronContext and is covered by its own spec.
    describe("promo art", () => {
        let promoCard;
        let patronPlayer;

        beforeEach(() => {
            promoCard = { id: "promo-card", name: "Promo Card", uuid: "promo-1", type: "character", packId: "promo-pack", controller: { name: "patron-user" } };
            patronPlayer = { name: "P", user: { username: "patron-user", settings: { patron: { usePromos: true } } }, cardPiles: {} };
        });

        it("uses promo art when the card owner (from controller) shows promos", () => {
            patronState.promoOwners = { "patron-user": true };
            render(<Card card={ promoCard } source="play area" />);
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("/assets/promo-card.abc123.webp");
        });

        it("uses standard art when the card owner does not show promos", () => {
            patronState.promoOwners = {};
            render(<Card card={ promoCard } source="play area" />);
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("/img/cards/promo-card-promo-pack.jpg");
        });

        it("falls back to the player prop for the owner when the card has no controller", () => {
            patronState.promoOwners = { "patron-user": true };
            const { controller: _omit, ...noControllerCard } = promoCard;
            render(<Card card={ noControllerCard } player={ patronPlayer } source="play area" />);
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("/assets/promo-card.abc123.webp");
        });
    });
});
