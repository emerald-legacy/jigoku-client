import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

vi.mock("../../client/FormComponents/Input.tsx", () => ({
    default: ({ name, value, children }: any) => (
        <div data-testid={ `input-${name}` } data-value={ value ?? "" }>{ children }</div>
    )
}));

vi.mock("../../client/FormComponents/Select.tsx", () => ({
    default: ({ name, value }: any) => <div data-testid={ `select-${name}` } data-value={ value ?? "" } />
}));

vi.mock("../../client/FormComponents/Typeahead.tsx", () => ({
    default: ({ children }: any) => <div data-testid="typeahead">{ children }</div>
}));

vi.mock("../../client/FormComponents/TextArea.tsx", () => ({
    default: ({ name, value }: any) => <textarea data-testid={ `textarea-${name}` } value={ value } readOnly />
}));

import InnerDeckEditor from "../../client/InnerDeckEditor";

const factions = {
    crab: { name: "Crab", value: "crab" },
    lion: { name: "Lion", value: "lion" }
};

const formats = {
    emerald: { name: "Emerald Legacy", value: "emerald" },
    skirmish: { name: "Skirmish", value: "skirmish" }
};

const packs = [{ id: "core", name: "Core Set" }];

const strongholdCard = {
    count: 1,
    pack_id: "core",
    card: { name: "Shiro Nishiyama", versions: [{ pack_id: "core" }] }
};

describe("the <InnerDeckEditor /> defaults", () => {
    let updateDeck: ReturnType<typeof vi.fn>;
    let baseProps: any;

    beforeEach(() => {
        updateDeck = vi.fn();
        baseProps = { factions, formats, packs, cards: {}, alliances: {}, updateDeck, onDeckSave: vi.fn() };
    });

    const selectValue = (name: string) => screen.getByTestId(`select-${name}`).getAttribute("data-value");

    it("should fill in the default clan and format for a deck that has neither", () => {
        render(<InnerDeckEditor { ...baseProps } deck={ { name: "New Deck" } } />);

        expect(selectValue("faction")).toBe("crab");
        expect(selectValue("format")).toBe("emerald");
    });

    it("should tell the store about the defaults it filled in", () => {
        render(<InnerDeckEditor { ...baseProps } deck={ { name: "New Deck" } } />);

        expect(updateDeck).toHaveBeenCalledTimes(1);
        expect(updateDeck).toHaveBeenCalledWith(expect.objectContaining({
            faction: factions.crab,
            format: formats.emerald,
            alliance: { name: "", value: "" }
        }));
    });

    it("should leave a deck that already has a clan and format alone", () => {
        render(<InnerDeckEditor
            { ...baseProps }
            deck={ { name: "Lion Deck", faction: factions.lion, format: formats.skirmish } }
        />);

        expect(selectValue("faction")).toBe("lion");
        expect(selectValue("format")).toBe("skirmish");
        expect(updateDeck).not.toHaveBeenCalled();
    });

    it("should only default the missing field", () => {
        render(<InnerDeckEditor { ...baseProps } deck={ { name: "Half Deck", faction: factions.lion } } />);

        expect(selectValue("faction")).toBe("lion");
        expect(selectValue("format")).toBe("emerald");
        expect(updateDeck).toHaveBeenCalledTimes(1);
    });

    it("should render the deck name into the form", () => {
        render(<InnerDeckEditor { ...baseProps } deck={ { name: "My Deck", faction: factions.lion, format: formats.emerald } } />);

        expect(screen.getByTestId("input-deckName").getAttribute("data-value")).toBe("My Deck");
    });

    it("should start the card list from the deck it was given", () => {
        render(<InnerDeckEditor
            { ...baseProps }
            deck={ { name: "My Deck", faction: factions.lion, format: formats.emerald, stronghold: [strongholdCard] } }
        />);

        expect(screen.getByTestId("textarea-cards")).toHaveValue("1 Shiro Nishiyama (Core Set)\n");
    });

    it("should start with an empty card list for an empty deck", () => {
        render(<InnerDeckEditor { ...baseProps } deck={ { name: "New Deck" } } />);

        expect(screen.getByTestId("textarea-cards")).toHaveValue("");
    });
});
