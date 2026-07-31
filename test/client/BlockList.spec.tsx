import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { InnerBlockList } from "../../client/BlockList.tsx";

vi.mock("../../client/SiteComponents/AlertPanel.tsx", () => ({
    default: ({ type, message }) => <div data-testid="alert-panel" data-type={ type }>{ message }</div>
}));

const skeletons = () => document.querySelectorAll(".blocklist-skeleton");

describe("the <InnerBlockList /> component", () => {
    let defaultProps;

    beforeEach(() => {
        defaultProps = {
            addBlockListEntry: vi.fn(),
            clearBlockListStatus: vi.fn(),
            loadBlockList: vi.fn(),
            removeBlockListEntry: vi.fn(),
            blockList: []
        };
    });

    it("should invite the player to act when nobody is blocked", () => {
        render(<InnerBlockList { ...defaultProps } />);

        expect(screen.getByText(/Nobody is blocked/)).toBeInTheDocument();
        expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("should list blocked players with a labelled unblock control", () => {
        render(<InnerBlockList { ...defaultProps } blockList={ ["kakita", "hida"] } />);

        expect(screen.getByText("kakita")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Unblock kakita" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Unblock hida" })).toBeInTheDocument();
    });

    it("should show how many players are blocked", () => {
        render(<InnerBlockList { ...defaultProps } blockList={ ["kakita", "hida"] } />);

        expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should keep the panel up while the list loads", () => {
        render(<InnerBlockList { ...defaultProps } loading blockList={ undefined } />);

        expect(screen.getByText("Block list")).toBeInTheDocument();
        expect(skeletons()).toHaveLength(3);
        expect(screen.queryByText(/Nobody is blocked/)).not.toBeInTheDocument();
    });

    it("should not submit an empty username", () => {
        render(<InnerBlockList { ...defaultProps } />);

        const button = screen.getByRole("button", { name: "Block" });

        expect(button).toBeDisabled();
        button.click();
        expect(defaultProps.addBlockListEntry).not.toHaveBeenCalled();
    });

    it("should remove the chosen player", () => {
        render(<InnerBlockList { ...defaultProps } blockList={ ["kakita"] } />);

        screen.getByRole("button", { name: "Unblock kakita" }).click();

        expect(defaultProps.removeBlockListEntry).toHaveBeenCalledWith({ user: undefined, username: "kakita" });
    });
});
