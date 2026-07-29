import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import React from "react";

import { InnerCourt } from "../../client/Court";
import type { OnlineUser } from "../../client/types/game";

const users: OnlineUser[] = [
    { name: "carol", status: "lobby" },
    { name: "Alice", status: "lobby", isPatron: true },
    { name: "bob", status: "playing" },
    { name: "dan", status: "spectating" },
    { name: "erin", status: "playing" }
];

function names(container: HTMLElement, status: "lobby" | "spectating") {
    const roll = container.querySelector(`.court-roll[data-status="${status}"]`);
    return roll ? Array.from(roll.querySelectorAll(".court-name")).map(n => n.textContent) : null;
}

describe("<InnerCourt />", () => {
    it("lists idle players and counts them", () => {
        const { container } = render(<InnerCourt users={ users } />);
        expect(names(container, "lobby")).toEqual(["Alice", "carol"]);
        expect(container.querySelector(".court-count")?.textContent).toBe("2");
    });

    it("lists spectators in their own group", () => {
        const { container } = render(<InnerCourt users={ users } />);
        expect(names(container, "spectating")).toEqual(["dan"]);
        const group = container.querySelector(".court-group");
        expect(within(group as HTMLElement).getByText("Watching")).toBeTruthy();
        expect(container.querySelector(".court-group-count")?.textContent).toBe("1");
    });

    it("leaves players who are mid-game out entirely", () => {
        const { container } = render(<InnerCourt users={ users } />);
        expect(container.textContent).not.toContain("bob");
        expect(container.textContent).not.toContain("erin");
    });

    it("excludes the signed-in player from the roll", () => {
        const { container } = render(<InnerCourt users={ users } username="carol" />);
        expect(names(container, "lobby")).toEqual(["Alice"]);
        expect(container.querySelector(".court-count")?.textContent).toBe("1");
    });

    it("marks patrons so they render in gold", () => {
        const { container } = render(<InnerCourt users={ users } />);
        expect(container.querySelector(".court-name--patron")?.textContent).toBe("Alice");
    });

    it("uses singular wording for a single idle player", () => {
        const { container } = render(<InnerCourt users={ [{ name: "carol", status: "lobby" }] } />);
        expect(container.querySelector(".court-count-label")?.textContent).toBe("player waiting for an opponent");
    });

    it("invites the player to start a game when nobody is idle", () => {
        const { container } = render(<InnerCourt users={ [{ name: "dan", status: "spectating" }] } />);
        expect(screen.getByText("No one is waiting")).toBeTruthy();
        expect(container.querySelector(".court-count")).toBeNull();
        expect(names(container, "spectating")).toEqual(["dan"]);
    });

    it("drops the watching group when nobody is spectating", () => {
        const { container } = render(<InnerCourt users={ [{ name: "carol", status: "lobby" }] } />);
        expect(container.querySelector(".court-group")).toBeNull();
    });

    it("renders as a titled panel like the other blocks in the column", () => {
        const { container } = render(<InnerCourt users={ users } />);
        expect(container.querySelector(".panel-title")?.textContent).toContain("The Court");
        expect(container.querySelector(".panel.court-body")).not.toBeNull();
    });
});
