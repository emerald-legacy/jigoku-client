import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import DeckRow from "../../client/DeckRow";
import type { Deck } from "../../client/types/deck";

const deck = { _id: "deck-1", name: "Crane Duelists", faction: { value: "crane", name: "Crane" } } as unknown as Deck;

describe("<DeckRow /> selection checkbox", () => {
    const renderRow = () => {
        const onClick = vi.fn();
        const onCheckboxChange = vi.fn();
        const { container } = render(<DeckRow deck={ deck } showCheckbox onClick={ onClick } onCheckboxChange={ onCheckboxChange } />);
        return { container, onClick, onCheckboxChange };
    };

    it("ticks the deck when its checkbox cell is tapped, without opening the deck", () => {
        const { container, onClick, onCheckboxChange } = renderRow();

        fireEvent.click(container.querySelector(".deck-row-checkbox")!);

        expect(onCheckboxChange).toHaveBeenCalledWith("deck-1");
        expect(onClick).not.toHaveBeenCalled();
    });

    it("names the checkbox after the deck", () => {
        renderRow();

        expect(screen.getByRole("checkbox", { name: "Select Crane Duelists" })).toBeInTheDocument();
    });

    it("opens the deck when the rest of the row is clicked", () => {
        const { onClick, onCheckboxChange } = renderRow();

        fireEvent.click(screen.getByText("Crane Duelists"));

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onCheckboxChange).not.toHaveBeenCalled();
    });
});

describe("<DeckRow /> status pill", () => {
    const pill = () => document.querySelector(".deck-row-status") as HTMLElement;

    it("is neutral while the deck is validating", () => {
        render(<DeckRow deck={ deck } />);
        expect(pill().className).toContain("validating");
        expect(pill().textContent).toBe("Validating");
    });

    it("marks an invalid deck", () => {
        render(<DeckRow deck={ { ...deck, status: { valid: false } } as Deck } />);
        expect(pill().className).toContain("invalid");
    });
});

describe("<DeckRow /> keyboard", () => {
    it("opens the deck with Enter or Space, like a button", () => {
        const onClick = vi.fn();
        render(<DeckRow deck={ deck } onClick={ onClick } />);
        const row = screen.getByRole("button", { name: /Crane Duelists/ });

        fireEvent.keyDown(row, { key: "Enter" });
        fireEvent.keyDown(row, { key: " " });

        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it("leaves keys inside the checkbox to the checkbox", () => {
        const onClick = vi.fn();
        render(<DeckRow deck={ deck } showCheckbox onClick={ onClick } onCheckboxChange={ vi.fn() } />);

        fireEvent.keyDown(screen.getByRole("checkbox"), { key: "Enter" });

        expect(onClick).not.toHaveBeenCalled();
    });

    it("names the clan icon", () => {
        render(<DeckRow deck={ deck } />);
        expect(screen.getByAltText("Crane")).toBeInTheDocument();
    });
});
