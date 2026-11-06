import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";

vi.mock("../../client/socket", () => ({ getLobbySocket: () => ({ emit: vi.fn() }) }));

import { InnerNewGame } from "../../client/NewGame";

describe("<InnerNewGame /> buttons", () => {
    const renderForm = () => {
        const cancelNewGame = vi.fn();
        render(<InnerNewGame connected cancelNewGame={ cancelNewGame } loadDecks={ vi.fn() } defaultGameName="Test game" />);
        return { cancelNewGame };
    };

    it("names the main action after what it does", () => {
        renderForm();
        expect(screen.getByRole("button", { name: "Create game" }).className).toContain("btn-primary");
    });

    it("shows Cancel as the quiet secondary action", () => {
        const { cancelNewGame } = renderForm();
        const cancel = screen.getByRole("button", { name: "Cancel" });
        expect(cancel.className).toContain("btn-quiet");
        fireEvent.click(cancel);
        expect(cancelNewGame).toHaveBeenCalledTimes(1);
    });
});

describe("<InnerNewGame /> form semantics", () => {
    const renderForm = () => render(<InnerNewGame connected cancelNewGame={ vi.fn() } loadDecks={ vi.fn() } defaultGameName="Test game" />);

    it("connects the name and password labels to their fields", () => {
        renderForm();
        expect(screen.getByLabelText("Name")).toHaveValue("Test game");
        expect(screen.getByLabelText("Password (optional)")).toHaveAttribute("type", "password");
    });

    it("groups the format and game type radios under their headings", () => {
        renderForm();
        const formats = within(screen.getByRole("radiogroup", { name: "Format" })).getAllByRole("radio");
        const types = within(screen.getByRole("radiogroup", { name: "Game Type" })).getAllByRole("radio");
        expect(formats).toHaveLength(5);
        expect(types).toHaveLength(3);
        expect(new Set(formats.map((radio) => radio.getAttribute("name")))).toEqual(new Set(["gameMode"]));
        expect(new Set(types.map((radio) => radio.getAttribute("name")))).toEqual(new Set(["gameType"]));
    });
});
