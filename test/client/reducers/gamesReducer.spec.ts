import { describe, it, expect } from "vitest";

import reducer, { receiveGameState, receiveNewGame } from "../../../client/reducers/games";
import type { GameMessage, GameState, Player } from "../../../client/types/game";

const alice: Player = {
    name: "alice",
    cardPiles: { hand: [], conflictDeck: [], dynastyDeck: [], conflictDiscardPile: [], dynastyDiscardPile: [], removedFromGame: [] },
    provinces: { one: [], two: [], three: [], four: [] }
};

function game(messages: GameMessage[]): GameState {
    return { id: "game-1", name: "Game", started: true, players: { alice }, spectators: [], messages };
}

describe("games reducer, receiveGameState with new messages", () => {
    it("appends the new messages and keeps the earlier message objects", () => {
        const first: GameMessage = { date: "1", message: [{ name: "first" }] };
        const second: GameMessage = { date: "2", message: [{ name: "second" }] };
        const started = reducer(undefined, receiveNewGame(game([first])));

        const next = reducer(started, receiveGameState({ ...game([second]), newMessages: [] }, "alice"));

        expect(next.currentGame?.messages).toEqual([first, second]);
        expect(next.currentGame?.messages[0]).toBe(started.currentGame?.messages[0]);
    });
});
