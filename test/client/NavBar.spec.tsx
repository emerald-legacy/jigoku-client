import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

vi.mock("../../client/Avatar.tsx", () => ({
    default: () => <div data-testid="avatar" />
}));

import { InnerNavBar } from "../../client/NavBar";

const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{ children }</MemoryRouter>;

describe("the <InnerNavBar /> context menu", () => {
    let onClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onClick = vi.fn();
    });

    const renderWithContext = (context: unknown[]) =>
        render(<InnerNavBar title="Jigoku" context={ context as any } />, { wrapper });

    it("should render a context item as a link", () => {
        renderWithContext([{ text: "Leave Game", onClick }]);

        expect(screen.getByText("Leave Game")).toBeInTheDocument();
    });

    it("should not use a javascript: URL", () => {
        renderWithContext([{ text: "Leave Game", onClick }]);

        const link = screen.getByText("Leave Game") as HTMLAnchorElement;
        expect(link.getAttribute("href")).toBe("#");
    });

    it("should run the item's action when clicked", () => {
        renderWithContext([{ text: "Leave Game", onClick }]);

        fireEvent.click(screen.getByText("Leave Game"));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should suppress the navigation the href would otherwise cause", () => {
        renderWithContext([{ text: "Leave Game", onClick }]);

        const event = new MouseEvent("click", { bubbles: true, cancelable: true });
        screen.getByText("Leave Game").dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
    });

    it("should not blow up on an item without an action", () => {
        renderWithContext([{ text: "Just Text" }]);

        fireEvent.click(screen.getByText("Just Text"));

        expect(screen.getByText("Just Text")).toBeInTheDocument();
    });

    it("should render every context item", () => {
        renderWithContext([{ text: "Leave Game", onClick }, { text: "Concede", onClick: vi.fn() }]);

        expect(screen.getByText("Leave Game")).toBeInTheDocument();
        expect(screen.getByText("Concede")).toBeInTheDocument();
    });
});
