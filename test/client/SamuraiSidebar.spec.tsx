import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import React from "react";

import type { OnlineUser } from "../../client/types/game";

const useSelectorMock = vi.fn();

vi.mock("../../client/hooks", () => ({
    useAppSelector: (selector: (s: unknown) => unknown) => useSelectorMock(selector)
}));

import SamuraiSidebar from "../../client/components/SamuraiSidebar/SamuraiSidebar";

function setUsers(users: OnlineUser[]) {
    useSelectorMock.mockImplementation((selector: (s: unknown) => unknown) => selector({ games: { users } }));
}

const sampleUsers: OnlineUser[] = [
    { name: "alice", status: "lobby" },
    { name: "bob", status: "playing" },
    { name: "carol", status: "playing" },
    { name: "dan", status: "spectating" }
];

describe("<SamuraiSidebar /> (collapsed by default)", () => {
    beforeEach(() => {
        setUsers(sampleUsers);
    });

    it("renders the rail and the burger when collapsed (CSS shows/hides per viewport)", () => {
        const { container } = render(<SamuraiSidebar />);
        expect(container.querySelector(".samurai-rail")).not.toBeNull();
        expect(container.querySelector(".samurai-burger")).not.toBeNull();
        expect(container.querySelector(".samurai-panel")).toBeNull();
    });

    it("marks the rail desktop-only and the burger mobile-only", () => {
        const { container } = render(<SamuraiSidebar />);
        expect(container.querySelector(".samurai-desktop-only .samurai-rail")).not.toBeNull();
        expect(container.querySelector(".samurai-burger.samurai-mobile-only")).not.toBeNull();
    });

    it("shows per-status counts on the rail", () => {
        const { container } = render(<SamuraiSidebar />);
        const rail = container.querySelector(".samurai-rail")!;
        const counts = within(rail as HTMLElement).getAllByText(/^\d+$/).map(n => n.textContent);
        expect(counts).toEqual(["1", "2", "1"]);
    });
});

describe("<SamuraiSidebar /> (expanded)", () => {
    beforeEach(() => {
        setUsers(sampleUsers);
    });

    function expand(container: HTMLElement) {
        fireEvent.click(within(container).getByLabelText("Expand samurai sidebar"));
    }

    it("renders the three groups in fixed order with their counts", () => {
        const { container } = render(<SamuraiSidebar />);
        expand(container);
        const groups = container.querySelectorAll(".samurai-group");
        const labels = Array.from(groups).map(g => g.querySelector(".samurai-group-label")?.textContent);
        const counts = Array.from(groups).map(g => g.querySelector(".samurai-group-count")?.textContent);
        expect(labels).toEqual(["At Court", "Dueling", "Watching"]);
        expect(counts).toEqual(["1", "2", "1"]);
    });

    it("renders the total count in the header equal to the user list length", () => {
        const { container } = render(<SamuraiSidebar />);
        expand(container);
        expect(container.querySelector(".samurai-total")?.textContent).toBe("4");
    });

    it("hides a group entirely when it has no members", () => {
        setUsers([
            { name: "alice", status: "lobby" },
            { name: "bob", status: "lobby" }
        ]);
        const { container } = render(<SamuraiSidebar />);
        expand(container);
        const labels = Array.from(container.querySelectorAll(".samurai-group-label")).map(n => n.textContent);
        expect(labels).toEqual(["At Court"]);
    });

    it("renders the matching glyph per status", () => {
        const { container } = render(<SamuraiSidebar />);
        expand(container);
        const lobbyRow = container.querySelector(".samurai-row[data-status='lobby']");
        const playingRow = container.querySelector(".samurai-row[data-status='playing']");
        const spectatingRow = container.querySelector(".samurai-row[data-status='spectating']");
        expect(lobbyRow?.querySelector(".samurai-glyph")?.textContent).toBe("◉");
        expect(playingRow?.querySelector(".samurai-glyph")?.textContent).toBe("⚔");
        expect(spectatingRow?.querySelector(".samurai-glyph")?.textContent).toBe("◇");
    });

    it("collapses back to the rail/burger when the close button is clicked", () => {
        const { container } = render(<SamuraiSidebar />);
        expand(container);
        fireEvent.click(screen.getByLabelText("Close samurai sidebar"));
        expect(container.querySelector(".samurai-panel")).toBeNull();
        expect(container.querySelector(".samurai-rail")).not.toBeNull();
    });

    it("also opens the panel when the mobile burger is clicked", () => {
        const { container } = render(<SamuraiSidebar />);
        fireEvent.click(screen.getByLabelText("Open samurai sidebar"));
        expect(container.querySelector(".samurai-panel")).not.toBeNull();
    });
});
