import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { InnerDecks } from "../../client/Decks.tsx";

const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{ children }</MemoryRouter>;

vi.mock("../../client/DeckSummary.tsx", () => ({
    default: ({ deck }) => <div data-testid="deck-summary">{ deck?.name || "No deck" }</div>
}));

vi.mock("../../client/DeckRow.tsx", () => ({
    default: ({ deck }) => <div data-testid="deck-row">{ deck.name }</div>
}));

vi.mock("../../client/SiteComponents/AlertPanel.tsx", () => ({
    default: ({ type, message }) => <div data-testid="alert-panel" data-type={ type }>{ message }</div>
}));

const skeletons = () => document.querySelectorAll(".deck-row-skeleton");

describe("the <InnerDecks /> component", () => {
    let defaultProps;

    beforeEach(() => {
        defaultProps = {
            clearDeckStatus: vi.fn(),
            deleteDeck: vi.fn(),
            deleteDecks: vi.fn(),
            loadDeckStats: vi.fn(),
            loadDecksWithLazyValidation: vi.fn(),
            selectDeck: vi.fn(),
            cards: {},
            decks: [],
            loading: false
        };
    });

    it("should show the panel while decks are still loading", () => {
        render(<InnerDecks { ...defaultProps } loading decks={ undefined } />, { wrapper });

        expect(screen.getByText("My Decks")).toBeInTheDocument();
        expect(screen.getByText("New Deck")).toBeInTheDocument();
        expect(skeletons()).toHaveLength(6);
    });

    it("should hide the deck count until the decks have arrived", () => {
        const { rerender } = render(<InnerDecks { ...defaultProps } loading decks={ undefined } />, { wrapper });

        expect(screen.queryByText(/\/ 50/)).not.toBeInTheDocument();

        rerender(<InnerDecks { ...defaultProps } decks={ [{ name: "Crab", faction: { value: "crab" } }] } />);

        expect(screen.getByText(/My Decks \(1 \/ 50\)/)).toBeInTheDocument();
    });

    it("should disable New Deck while loading so the limit cannot be bypassed", () => {
        render(<InnerDecks { ...defaultProps } loading decks={ undefined } />, { wrapper });

        expect(screen.getByRole("button", { name: "New Deck" })).toBeDisabled();
    });

    it("should replace the skeleton with the decks once loaded", () => {
        const { rerender } = render(<InnerDecks { ...defaultProps } loading decks={ undefined } />, { wrapper });

        rerender(<InnerDecks
            { ...defaultProps }
            decks={ [{ name: "Crab", faction: { value: "crab" } }, { name: "Crane", faction: { value: "crane" } }] }
        />);

        expect(skeletons()).toHaveLength(0);
        expect(screen.getAllByTestId("deck-row")).toHaveLength(2);
    });

    it("should show the empty state when the account has no decks", () => {
        render(<InnerDecks { ...defaultProps } decks={ [] } />, { wrapper });

        expect(screen.getByText("You have no decks, try adding one.")).toBeInTheDocument();
        expect(skeletons()).toHaveLength(0);
    });

    it("should show the api error instead of the panel once loading finished", () => {
        render(<InnerDecks { ...defaultProps } apiError="Nope" />, { wrapper });

        expect(screen.getByTestId("alert-panel")).toHaveAttribute("data-type", "error");
        expect(screen.queryByText("My Decks")).not.toBeInTheDocument();
    });
});
