import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { TransitionGroup } from "react-transition-group";
import React from "react";

vi.mock("../../../client/GameComponents/Card.tsx", () => ({
    default: ({ card }: any) => <div className="card-wrapper" data-testid={ `card-${card.uuid}` }>{ card.name }</div>
}));

import PlayAreaCard, { PLAY_EXIT_MS } from "../../../client/GameComponents/PlayAreaCard";
import PlayAreaRow from "../../../client/GameComponents/PlayAreaRow";

const card = (uuid: string) => ({ uuid, name: `Card ${uuid}`, type: "character" });

const renderRow = (cards: { uuid: string; name: string }[]) => (
    <TransitionGroup component={ null }>
        <PlayAreaRow key="row" className="card-row">
            <TransitionGroup component={ null }>
                { cards.map(c => <PlayAreaCard key={ c.uuid } card={ c as any } />) }
            </TransitionGroup>
        </PlayAreaRow>
    </TransitionGroup>
);

describe("the play area exit transitions", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const cardsOnScreen = (container: HTMLElement) => Array.from(container.querySelectorAll("[data-testid^='card-']"))
        .map(el => el.getAttribute("data-testid"));

    it("should render the cards it is given", () => {
        const { container } = render(renderRow([card("a"), card("b")]));

        expect(cardsOnScreen(container)).toEqual(["card-a", "card-b"]);
    });

    it("should keep a removed card on screen while it animates out", () => {
        const { container, rerender } = render(renderRow([card("a"), card("b")]));

        rerender(renderRow([card("a")]));

        expect(cardsOnScreen(container)).toEqual(["card-a", "card-b"]);
        expect(container.querySelector(".play-card-exit")).not.toBeNull();
    });

    it("should drop the card once the animation has run", () => {
        const { container, rerender } = render(renderRow([card("a"), card("b")]));
        rerender(renderRow([card("a")]));

        act(() => {
            vi.advanceTimersByTime(PLAY_EXIT_MS);
        });

        expect(cardsOnScreen(container)).toEqual(["card-a"]);
    });

    it("should keep the last card of a row on screen via the row transition", () => {
        const { container, rerender } = render(renderRow([card("a")]));

        rerender(
            <TransitionGroup component={ null }>
                { [] }
            </TransitionGroup>
        );

        expect(cardsOnScreen(container)).toEqual(["card-a"]);
        expect(container.querySelector(".play-row-exit")).not.toBeNull();
    });

    it("should drop the whole row once its animation has run", () => {
        const { container, rerender } = render(renderRow([card("a")]));
        rerender(<TransitionGroup component={ null }>{ [] }</TransitionGroup>);

        act(() => {
            vi.advanceTimersByTime(PLAY_EXIT_MS);
        });

        expect(cardsOnScreen(container)).toEqual([]);
        expect(container.querySelector(".card-row")).toBeNull();
    });

    it("should not mark a card as exiting while it is still in play", () => {
        const { container, rerender } = render(renderRow([card("a"), card("b")]));

        rerender(renderRow([card("a"), card("b")]));

        expect(container.querySelector(".play-card-exit")).toBeNull();
    });
});
