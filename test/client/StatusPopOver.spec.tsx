import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import StatusPopOver from "../../client/StatusPopOver";

describe("<StatusPopOver />", () => {
    it("renders only the status text when show is false (no popover container at all)", () => {
        const { container } = render(<StatusPopOver status="Valid" show={ false }><span>hidden</span></StatusPopOver>);
        expect(screen.getByText("Valid")).toBeInTheDocument();
        expect(container.querySelector(".status-popover-container")).toBeNull();
    });

    it("does not render the popover until the trigger is hovered (saves DOM weight on the deck list)", () => {
        const { container } = render(<StatusPopOver status="Validating" show><span>tooltip body</span></StatusPopOver>);
        expect(container.querySelector(".popover")).toBeNull();
    });

    it("renders the popover children on hover and removes them on leave", () => {
        const { container } = render(<StatusPopOver status="Invalid" show><span data-testid="body">deck too small</span></StatusPopOver>);
        const trigger = container.querySelector(".status-popover-container") as HTMLElement;
        fireEvent.mouseEnter(trigger);
        expect(screen.getByTestId("body")).toBeInTheDocument();
        fireEvent.mouseLeave(trigger);
        expect(screen.queryByTestId("body")).toBeNull();
    });

    it("renders untrusted strings as text, not HTML (regression: previously rendered via dangerouslySetInnerHTML)", () => {
        const malicious = "<img src=x onerror=\"alert(1)\">attacker</img>";
        const { container } = render(
            <StatusPopOver status="Invalid" show>
                <span>{ malicious }</span>
            </StatusPopOver>
        );
        fireEvent.mouseEnter(container.querySelector(".status-popover-container") as HTMLElement);
        const popover = container.querySelector(".popover-content");
        // The exact string appears verbatim in textContent (React escaped it), and no <img> element was injected.
        expect(popover?.textContent).toContain(malicious);
        expect(popover?.querySelector("img")).toBeNull();
    });
});
