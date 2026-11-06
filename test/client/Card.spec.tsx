import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
    default: ({ title, source }) => <div data-testid="card-pile" data-source={ source }>{ title }</div>
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
import { CardDragContext } from "../../client/GameComponents/CardDragContext";

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

    // Cards set aside by an effect (Favorable Alliance, Shachihoko Bay) sit in "removed from
    // game" but stay playable; the engine sends playableBy so they can be told apart from the
    // rest of the pile.
    describe("that is playable from out of play", () => {
        it("should mark the card as playable", () => {
            render(<Card card={ { ...card, location: "removed from game", playableBy: ["player1"] } } source="removed from game" />);

            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("playable-out-of-play");
        });

        it("should mark it however many players can play it", () => {
            render(<Card card={ { ...card, playableBy: ["player1", "player2"] } } source="removed from game" />);

            expect(document.querySelector(".card").className).toContain("playable-out-of-play");
        });

        it("should not mark an ordinary removed from game card", () => {
            render(<Card card={ { ...card, location: "removed from game" } } source="removed from game" />);

            expect(document.querySelector(".card").className).not.toContain("playable-out-of-play");
        });

        it("should not mark a card whose playableBy has been emptied", () => {
            render(<Card card={ { ...card, playableBy: [] } } source="removed from game" />);

            expect(document.querySelector(".card").className).not.toContain("playable-out-of-play");
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

    // The engine reports a chosen card as both selected and selectable. Only
    // "selected" may win, or the pale selectable glow styles it instead of the ring.
    describe("that is both selected and selectable", () => {
        beforeEach(() => {
            render(<Card card={ { ...card, selected: true, selectable: true } } source="hand" />);
        });

        it("should mark the card as selected and not selectable", () => {
            const cardElement = document.querySelector(".card");
            expect(cardElement.className).toContain("selected");
            expect(cardElement.className.split(/\s+/)).not.toContain("selectable");
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
            expect(cardImage.src).toContain("/img/cards/test-card-1-core");
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
            expect(cardImage.src).toContain("/img/cards/promo-card-promo-pack");
        });

        it("falls back to the player prop for the owner when the card has no controller", () => {
            patronState.promoOwners = { "patron-user": true };
            const { controller: _omit, ...noControllerCard } = promoCard;
            render(<Card card={ noControllerCard } player={ patronPlayer } source="play area" />);
            const cardImage = document.querySelector(".card-image-src");
            expect(cardImage.src).toContain("/assets/promo-card.abc123.webp");
        });
    });

    describe("cards underneath", () => {
        it("drags a card from under the stronghold from its location", () => {
            const under = { uuid: "u-1", name: "Imperial Storehouse", location: "underneath stronghold" };
            render(<Card card={ { ...card, childCards: [under] } } source="stronghold province" />);
            expect(screen.getByTestId("card-pile").dataset.source).toBe("underneath stronghold");
        });

        it("drags a card from under a host card from its location", () => {
            const under = { uuid: "u-2", name: "Let Go", location: "underneath" };
            const player = { name: "P", cardPiles: { [card.uuid]: [under] } };
            render(<Card card={ card } player={ player } source="play area" />);
            expect(screen.getByTestId("card-pile").dataset.source).toBe("underneath");
        });
    });

    describe("dragging", () => {
        it("starts a drag with the card and its source", () => {
            render(<Card card={ card } source="hand" />);
            const setData = vi.fn();
            const element = document.querySelector(".card");
            expect(element.getAttribute("draggable")).toBe("true");
            fireEvent.dragStart(element, { dataTransfer: { setData } });
            expect(setData).toHaveBeenCalledWith("Text", JSON.stringify({ card, source: "hand" }));
        });

        it("does not drag a card that is not draggable", () => {
            render(<Card card={ card } source="role card" draggable={ false } />);
            const setData = vi.fn();
            const element = document.querySelector(".card");
            expect(element.getAttribute("draggable")).toBe("false");
            fireEvent.dragStart(element, { dataTransfer: { setData } });
            expect(setData).not.toHaveBeenCalled();
        });
    });
    describe("long press on a touch screen", () => {
        const press = () => fireEvent.touchStart(document.querySelector(".card")!, { touches: [{ clientX: 10, clientY: 10 }] });

        beforeEach(() => {
            vi.useFakeTimers();
            render(<Card card={ card } source="play area" onMouseOver={ onMouseOver } onMouseOut={ onMouseOut } onClick={ onClick } />);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("zooms the card after holding it, and cancels the click that would follow", () => {
            press();
            vi.advanceTimersByTime(500);

            expect(onMouseOver).toHaveBeenCalledWith(card);
            const touchEnd = new TouchEvent("touchend", { bubbles: true, cancelable: true });
            document.querySelector(".card")!.dispatchEvent(touchEnd);
            expect(touchEnd.defaultPrevented).toBe(true);
        });

        it("shows the card's stats after a long press, until the next touch", () => {
            press();
            act(() => vi.advanceTimersByTime(500));
            expect(document.querySelector(".card-frame")!.className).toContain("peeking");

            fireEvent.touchStart(document.body, { touches: [{ clientX: 300, clientY: 300 }] });
            expect(document.querySelector(".card-frame")!.className).not.toContain("peeking");
        });

        it("does not zoom on a short tap, and leaves its click alone", () => {
            press();
            vi.advanceTimersByTime(200);
            const touchEnd = new TouchEvent("touchend", { bubbles: true, cancelable: true });
            document.querySelector(".card")!.dispatchEvent(touchEnd);
            vi.advanceTimersByTime(500);

            expect(onMouseOver).not.toHaveBeenCalled();
            expect(touchEnd.defaultPrevented).toBe(false);
        });

        it("does not zoom when the finger moves (a drag or a scroll)", () => {
            press();
            fireEvent.touchMove(document.querySelector(".card")!, { touches: [{ clientX: 40, clientY: 10 }], targetTouches: [{ clientX: 40, clientY: 10, screenX: 40, screenY: 10 }] });
            vi.advanceTimersByTime(500);

            expect(onMouseOver).not.toHaveBeenCalled();
        });
    });
    describe("dragging", () => {
        it("is on by default", () => {
            render(<Card card={ card } source="hand" />);

            expect(document.querySelector(".card")!.getAttribute("draggable")).toBe("true");
        });

        it("is off when the board turns it off (auto mode, spectators)", () => {
            render(<CardDragContext value={ false }><Card card={ card } source="hand" /></CardDragContext>);

            expect(document.querySelector(".card")!.getAttribute("draggable")).toBe("false");
        });
    });
});
