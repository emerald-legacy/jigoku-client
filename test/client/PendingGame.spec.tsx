import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("../../client/SiteComponents/AlertPanel.tsx", () => ({
    default: ({ message }: any) => <div data-testid="alert-panel">{ message }</div>
}));

vi.mock("../../client/DeckRow.tsx", () => ({
    default: ({ deck }: any) => <div data-testid="deck-row">{ deck?.name }</div>
}));

vi.mock("../../client/GameComponents/Messages.tsx", () => ({
    default: () => <div data-testid="messages" />
}));

vi.mock("../../client/Avatar.tsx", () => ({
    default: () => <div data-testid="avatar" />
}));

vi.mock("../../client/DeckStatus.tsx", () => ({
    default: () => <div data-testid="deck-status" />
}));

vi.mock("../../client/PatronName.tsx", () => ({
    PatronName: ({ name }: any) => <span>{ name }</span>
}));

import { InnerPendingGame } from "../../client/PendingGame";

const readyGame = (overrides: Record<string, unknown> = {}) => ({
    id: "game-1",
    name: "Test Game",
    owner: "Me",
    started: false,
    messages: [],
    spectators: [],
    players: {
        Me: { name: "Me", deck: { selected: true, name: "My Deck" } },
        Them: { name: "Them", deck: { selected: true, name: "Their Deck" } }
    },
    ...overrides
});

describe("the <InnerPendingGame /> start flow", () => {
    let sendSocketMessage: ReturnType<typeof vi.fn>;
    let baseProps: any;

    beforeEach(() => {
        sendSocketMessage = vi.fn();
        baseProps = {
            currentGame: readyGame(),
            username: "Me",
            decks: [],
            connecting: false,
            loading: false,
            sendSocketMessage,
            gameSocketClose: vi.fn(),
            loadDecks: vi.fn(),
            zoomCard: vi.fn()
        };
    });

    const startButton = () => screen.getByRole("button", { name: "Start" });
    const status = () => (document.querySelector(".game-status") as HTMLElement).textContent;

    it("should offer to start once every player has a deck", () => {
        render(<InnerPendingGame { ...baseProps } />);

        expect(startButton()).not.toBeDisabled();
        expect(status()).toMatch(/Ready to begin/);
    });

    it("should ask the lobby to start the game", () => {
        render(<InnerPendingGame { ...baseProps } />);

        fireEvent.click(startButton());

        expect(sendSocketMessage).toHaveBeenCalledWith("startgame", "game-1");
    });

    // `waiting` is state.socket.startRequested; the socket slice owns its lifetime
    it("should report waiting on the lobby while a start request is outstanding", () => {
        render(<InnerPendingGame { ...baseProps } waiting />);

        expect(status()).toMatch(/Waiting for lobby server/);
        expect(startButton()).toBeDisabled();
    });

    it("should hand over to the game view once the lobby reports the game as started", () => {
        render(<InnerPendingGame { ...baseProps } currentGame={ readyGame({ started: true }) } />);

        expect(screen.getByText(/Loading game in progress/)).toBeInTheDocument();
    });

    it("should report the game server it is connecting to", () => {
        render(<InnerPendingGame { ...baseProps } connecting host="node-1" />);

        expect(status()).toMatch(/Connecting to game server: node-1/);
    });

    it("should offer to start again once the request has been cleared", () => {
        render(<InnerPendingGame { ...baseProps } waiting={ false } />);

        expect(status()).toMatch(/Ready to begin/);
        expect(startButton()).not.toBeDisabled();
    });

    it("should not offer to start while a player is missing a deck", () => {
        render(<InnerPendingGame
            { ...baseProps }
            currentGame={ readyGame({ players: { Me: { name: "Me", deck: { selected: true } }, Them: { name: "Them" } } }) }
        />);

        expect(startButton()).toBeDisabled();
        expect(status()).toMatch(/Waiting for players to select decks/);
    });
});
