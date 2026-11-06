import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

vi.mock("../../client/NewGame", () => ({ default: () => <div data-testid="new-game" /> }));
vi.mock("../../client/GameList", () => ({ default: () => <div data-testid="game-list" /> }));
vi.mock("../../client/GameStats", () => ({ default: () => <div data-testid="game-stats" /> }));
vi.mock("../../client/Court", () => ({ default: () => <div data-testid="court" /> }));
vi.mock("../../client/PendingGame", () => ({ default: () => <div data-testid="pending-game" /> }));
vi.mock("../../client/PasswordGame", () => ({ default: () => <div data-testid="password-game" /> }));

import { InnerGameLobby } from "../../client/GameLobby";

const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{ children }</MemoryRouter>;
const baseProps = { games: [], loadGameStats: vi.fn(), setContextMenu: vi.fn(), startNewGame: vi.fn() };

describe("<InnerGameLobby />", () => {
    it("offers a guest a link to log in instead of a New Game button that fails", () => {
        render(<InnerGameLobby { ...baseProps } />, { wrapper });

        expect(screen.getByRole("link", { name: "Log in to play" })).toHaveAttribute("href", "/login");
        expect(screen.queryByRole("button", { name: "New Game" })).toBeNull();
    });

    it("shows New Game to a logged-in player", () => {
        render(<InnerGameLobby { ...baseProps } username="Me" />, { wrapper });

        expect(screen.getByRole("button", { name: "New Game" })).toBeInTheDocument();
    });

    it("explains the empty game list", () => {
        render(<InnerGameLobby { ...baseProps } username="Me" />, { wrapper });

        expect(screen.getByText(/No open games\. Start one with New Game/)).toBeInTheDocument();
    });
});
