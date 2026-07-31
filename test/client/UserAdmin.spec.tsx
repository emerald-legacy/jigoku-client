import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { InnerUserAdmin } from "../../client/UserAdmin.tsx";

vi.mock("../../client/SiteComponents/AlertPanel.tsx", () => ({
    default: ({ type, message }) => <div data-testid="alert-panel" data-type={ type }>{ message }</div>
}));

describe("the <InnerUserAdmin /> component", () => {
    let defaultProps;

    beforeEach(() => {
        defaultProps = {
            clearUserStatus: vi.fn(),
            findUser: vi.fn(),
            saveUser: vi.fn()
        };
    });

    it("should render before any user has been looked up", () => {
        expect(() => render(<InnerUserAdmin { ...defaultProps } />)).not.toThrow();
    });

    it("should show a looked up user's saved permissions", () => {
        render(<InnerUserAdmin
            { ...defaultProps }
            currentUser={ { username: "ben", permissions: { canEditNews: true } } }
        />);

        expect(screen.getByText("ben")).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: /News Editor/ })).toBeChecked();
        expect(screen.getByRole("checkbox", { name: /User Manager/ })).not.toBeChecked();
    });

    it("should fall back to defaults for a user with no permissions set", () => {
        render(<InnerUserAdmin { ...defaultProps } currentUser={ { username: "ben" } } />);

        expect(screen.getByRole("checkbox", { name: /News Editor/ })).not.toBeChecked();
    });
});
