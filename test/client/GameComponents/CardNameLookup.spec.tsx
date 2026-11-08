import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

const typeahead = vi.hoisted(() => ({ options: [] as string[] }));

vi.mock("../../../client/FormComponents/Typeahead", () => ({
    default: ({ options }: { options: string[] }) => {
        typeahead.options = options;
        return null;
    }
}));

import CardNameLookup from "../../../client/GameComponents/CardNameLookup";
import type { Card } from "../../../client/types/game";

const card = (id: string, name: string, type: string, side: string, isUnique = false): Card =>
    ({ id, uuid: id, name, type, side, is_unique: isUnique, facedown: false });

const cards: Record<string, Card> = {
    "gossip": card("gossip", "Gossip", "event", "conflict"),
    "fine-katana": card("fine-katana", "Fine Katana", "attachment", "conflict"),
    "bayushi-kachiko": card("bayushi-kachiko", "Bayushi Kachiko", "character", "dynasty", true),
    "bayushi-kachiko-2": card("bayushi-kachiko-2", "Bayushi Kachiko", "character", "conflict", true),
    "brash-samurai": card("brash-samurai", "Brash Samurai", "character", "dynasty"),
    "favorable-ground": card("favorable-ground", "Favorable Ground", "holding", "dynasty"),
    "shiro-kitsuki": card("shiro-kitsuki", "Shiro Kitsuki", "stronghold", "province")
};

const optionsFor = (filter?: Parameters<typeof CardNameLookup>[0]["filter"]) => {
    render(<CardNameLookup cards={ cards } filter={ filter } />);
    return [...typeahead.options].sort();
};

describe("the <CardNameLookup /> options", () => {
    it("are every card name, once, without a filter", () => {
        expect(optionsFor()).toEqual(["Bayushi Kachiko", "Brash Samurai", "Favorable Ground", "Fine Katana", "Gossip", "Shiro Kitsuki"]);
    });

    it("include a name if any card with it is on a filtered side", () => {
        expect(optionsFor({ sides: ["conflict"] })).toEqual(["Bayushi Kachiko", "Fine Katana", "Gossip"]);
    });

    it("are limited to the filtered types", () => {
        expect(optionsFor({ types: ["character", "attachment", "event"] })).toEqual(["Bayushi Kachiko", "Brash Samurai", "Fine Katana", "Gossip"]);
    });

    it("can be limited to non-unique cards", () => {
        expect(optionsFor({ types: ["character"], sides: ["dynasty"], unique: false })).toEqual(["Brash Samurai"]);
    });
});
