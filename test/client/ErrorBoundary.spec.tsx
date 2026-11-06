import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

vi.mock("../../client/http", () => ({ http: { post: vi.fn(() => Promise.resolve()) } }));

import ErrorBoundary from "../../client/SiteComponents/ErrorBoundary";
import NotFound from "../../client/NotFound";

function Broken(): React.ReactNode {
    throw new Error("boom");
}

describe("<ErrorBoundary />", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("says what happened and offers to reload or go back to the lobby", () => {
        const navigate = vi.fn();
        render(<ErrorBoundary message="Something went wrong and this page can't be shown." navigate={ navigate }><Broken /></ErrorBoundary>);

        expect(screen.getByText("Something went wrong and this page can't be shown.")).toBeInTheDocument();
        expect(screen.getByText("The error has been logged.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back to the lobby" }));
        expect(navigate).toHaveBeenCalledWith("/");
    });

    it("leaves out Back to the lobby when it can't navigate", () => {
        render(<ErrorBoundary message="Something went wrong and the site can't be shown."><Broken /></ErrorBoundary>);

        expect(screen.queryByRole("button", { name: "Back to the lobby" })).toBeNull();
    });
});

describe("<NotFound />", () => {
    it("links back to the lobby", () => {
        render(<MemoryRouter><NotFound /></MemoryRouter>);

        expect(screen.getByRole("link", { name: "Back to the lobby" })).toHaveAttribute("href", "/");
    });
});
