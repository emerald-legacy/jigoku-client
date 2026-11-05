import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const emitSpy = vi.hoisted(() => vi.fn());

vi.mock("../../client/socket", () => ({
    getLobbySocket: () => ({ emit: emitSpy })
}));

vi.mock("../../client/patronStatus", () => ({
    usePatronStatus: () => false
}));

import { InnerGameList } from "../../client/GameList";
import type { GameState } from "../../client/types/game";

const startedGame = {
    id: "g1",
    name: "Game",
    owner: "alice",
    started: true,
    allowSpectators: false,
    needsPassword: true,
    players: { alice: { name: "alice", faction: "crab" } }
};

const currentGame: GameState = { id: "g2", name: "Other", started: true, players: {}, spectators: [], messages: [] };

describe("<InnerGameList /> rejoin", () => {
    beforeEach(() => {
        emitSpy.mockReset();
    });

    it("shows Rejoin on a started game the user left and sends the rejoin request without a password prompt", () => {
        const joinPasswordGame = vi.fn();
        render(<InnerGameList games={ [{ ...startedGame, canRejoin: true }] } username="bob" joinPasswordGame={ joinPasswordGame } />);

        fireEvent.click(screen.getByRole("button", { name: "Rejoin" }));

        expect(emitSpy).toHaveBeenCalledExactlyOnceWith("watchgame", "g1");
        expect(joinPasswordGame).not.toHaveBeenCalled();
        expect(screen.queryByRole("button", { name: "Watch" })).toBeNull();
    });

    it("shows no Rejoin on other games or while the user is in a game", () => {
        const { rerender } = render(<InnerGameList games={ [startedGame] } username="bob" joinPasswordGame={ vi.fn() } />);
        expect(screen.queryByRole("button", { name: "Rejoin" })).toBeNull();

        rerender(<InnerGameList games={ [{ ...startedGame, canRejoin: true }] } currentGame={ currentGame } username="bob" joinPasswordGame={ vi.fn() } />);
        expect(screen.queryByRole("button", { name: "Rejoin" })).toBeNull();
    });
});
