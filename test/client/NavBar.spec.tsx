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

describe("the <InnerNavBar /> mobile menu", () => {
    const leftMenu = [
        { name: "Decks", path: "/decks" },
        { name: "Help", childItems: [{ name: "About", path: "/about" }] }
    ];
    const rightMenu = [
        { name: "TestUser", childItems: [{ name: "Profile", path: "/profile" }] }
    ];

    const renderMenu = () => render(
        <>
            <InnerNavBar title="Jigoku" leftMenu={ leftMenu } rightMenu={ rightMenu } />
            <p>Page</p>
        </>,
        { wrapper }
    );
    const toggle = () => screen.getByRole("button", { name: "Toggle Navigation" });
    const menu = () => document.getElementById("navbar") as HTMLElement;
    const isOpen = () => !menu().classList.contains("hidden");
    const dropdownOf = (name: string) => screen.getByText(name).closest("li") as HTMLElement;

    it("should open and close with the toggle", () => {
        renderMenu();

        expect(isOpen()).toBe(false);
        fireEvent.click(toggle());
        expect(isOpen()).toBe(true);
        expect(toggle().getAttribute("aria-expanded")).toBe("true");
        fireEvent.click(toggle());
        expect(isOpen()).toBe(false);
    });

    it("should close after a link navigates", () => {
        renderMenu();

        fireEvent.click(toggle());
        fireEvent.click(screen.getByText("Decks"));

        expect(isOpen()).toBe(false);
    });

    it("should close on a tap outside the navbar", () => {
        renderMenu();

        fireEvent.click(toggle());
        fireEvent.click(screen.getByText("Page"));

        expect(isOpen()).toBe(false);
    });

    it("should close the menu and the dropdowns on Escape", () => {
        renderMenu();

        fireEvent.click(toggle());
        fireEvent.click(screen.getByText("Help"));
        fireEvent.keyDown(document, { key: "Escape" });

        expect(isOpen()).toBe(false);
        expect(dropdownOf("Help").classList.contains("open")).toBe(false);
    });

    it("should close an open dropdown when another one opens", () => {
        renderMenu();

        fireEvent.click(screen.getByText("Help"));
        expect(dropdownOf("Help").classList.contains("open")).toBe(true);

        fireEvent.click(screen.getByText("TestUser"));

        expect(dropdownOf("Help").classList.contains("open")).toBe(false);
        expect(dropdownOf("TestUser").classList.contains("open")).toBe(true);
    });

    it("should close the first dropdown on a tap outside it", () => {
        renderMenu();

        fireEvent.click(screen.getByText("Help"));
        fireEvent.click(screen.getByText("Page"));

        expect(dropdownOf("Help").classList.contains("open")).toBe(false);
    });
});
