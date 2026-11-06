import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
