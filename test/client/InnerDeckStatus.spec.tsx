import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import InnerDeckStatus from "../../client/InnerDeckStatus";

// Guard: if a code path ever falls through to client-side validation for a pending-game deck
// (which has no card arrays), the test should fail loudly rather than silently "validate".
vi.mock("../../client/deck-validator", () => ({
    default: vi.fn(async () => ({ valid: false, extendedStatus: ["should not be called"] }))
}));

// Pending-game decks as delivered by the server getSummary: pre-validated `status`, a name, and a
// `selected` flag — but NO `_id` and no card arrays.
const summaryDeck = (name: string, valid: boolean) =>
    ({ name, selected: true, status: { valid, extendedStatus: valid ? [] : ["Too few cards"] } } as never);

describe("InnerDeckStatus (pending-game deck selection)", () => {
    it("shows the server-provided validity for the selected deck", () => {
        render(<InnerDeckStatus deck={ summaryDeck("Bad Deck", false) } />);
        expect(screen.getByText("Invalid")).toBeInTheDocument();
    });

    it("updates the tag when switching from an invalid deck to a valid one", () => {
        const { rerender } = render(<InnerDeckStatus deck={ summaryDeck("Bad Deck", false) } />);
        expect(screen.getByText("Invalid")).toBeInTheDocument();

        // Switching decks: a different summary deck arrives (no _id on either) — the tag must follow.
        rerender(<InnerDeckStatus deck={ summaryDeck("Good Deck", true) } />);
        expect(screen.getByText("Valid")).toBeInTheDocument();
        expect(screen.queryByText("Invalid")).not.toBeInTheDocument();
    });

    it("updates the tag for a same-named deck whose validity changed", () => {
        const { rerender } = render(<InnerDeckStatus deck={ summaryDeck("My Deck", false) } />);
        expect(screen.getByText("Invalid")).toBeInTheDocument();

        rerender(<InnerDeckStatus deck={ summaryDeck("My Deck", true) } />);
        expect(screen.getByText("Valid")).toBeInTheDocument();
    });
});
