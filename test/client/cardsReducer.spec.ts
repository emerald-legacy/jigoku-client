import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import cardsReducer, { selectDeck, addDeck, updateDeck, receiveDecksUnvalidated } from "../../client/reducers/cards";
import { loadCards, loadFactions } from "../../client/ReduxActions/cards";
import { loadDecks } from "../../client/ReduxActions/deck";

function makeStore() {
    return configureStore({
        reducer: { cards: cardsReducer },
        middleware: (m) => m({ serializableCheck: false, immutableCheck: false })
    });
}

describe("cards reducer", () => {
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
        store = makeStore();
        store.dispatch(loadCards.fulfilled(
            { cards: { c1: { id: "c1", type: "character", side: "dynasty", name: "Card 1" } } },
            "req-cards"
        ));
        store.dispatch(loadFactions.fulfilled(
            { factions: [{ name: "Crab", value: "crab" }] },
            "req-factions"
        ));
    });

    it("loadDecks.fulfilled sets the deck list and selects the first", () => {
        store.dispatch(loadDecks.fulfilled(
            {
                decks: [
                    { _id: "a", name: "A", faction: { name: "Crab", value: "crab" } },
                    { _id: "b", name: "B", faction: { name: "Crab", value: "crab" } }
                ]
            },
            "req-decks",
            null
        ));
        const state = store.getState().cards;
        expect(state.decks?.length).toBe(2);
        expect(state.selectedDeck?._id).toBe("a");
    });

    it("selectDeck sets the chosen deck as selectedDeck", () => {
        store.dispatch(loadDecks.fulfilled(
            {
                decks: [
                    { _id: "a", name: "A", faction: { name: "Crab", value: "crab" } },
                    { _id: "b", name: "B", faction: { name: "Crab", value: "crab" } }
                ]
            },
            "req-decks",
            null
        ));
        const deckB = store.getState().cards.decks[1];
        store.dispatch(selectDeck(deckB));
        expect(store.getState().cards.selectedDeck?._id).toBe("b");
    });

    it("addDeck creates a new in-progress deck", () => {
        store.dispatch(addDeck());
        expect(store.getState().cards.selectedDeck?.name).toBe("New Deck");
        expect(store.getState().cards.selectedDeck?._id).toBeUndefined();
    });

    it("updateDeck replaces selectedDeck", () => {
        const incoming = {
            _id: "x",
            name: "X",
            faction: { name: "Crab", value: "crab" },
            stronghold: [{ count: 1, card: { id: "c1" }, pack_id: "core" }],
            conflictCards: [], dynastyCards: [], provinceCards: [], role: []
        };
        store.dispatch(updateDeck(incoming));
        const sel = store.getState().cards.selectedDeck;
        expect(sel?._id).toBe("x");
        expect(sel?.stronghold?.[0]?.card?.id).toBe("c1");
    });

    it("receiveDecksUnvalidated hydrates card stubs from the catalog so DeckSummary can render name/type (regression: was discarding processDecks return value, leaving stubs unhydrated)", () => {
        store.dispatch(receiveDecksUnvalidated([
            {
                _id: "x",
                name: "X",
                faction: { name: "Crab", value: "crab" },
                conflictCards: [{ count: 3, card: { id: "c1" }, pack_id: "core" }],
                dynastyCards: [], provinceCards: [], role: [], stronghold: []
            }
        ]));
        const sel = store.getState().cards.selectedDeck;
        expect(sel?.conflictCards?.[0]?.card).toMatchObject({ id: "c1", name: "Card 1", type: "character" });
    });

    it("receiveDecksUnvalidated still selects the first deck even when only stubs are sent (preserves the existing selection flow)", () => {
        store.dispatch(receiveDecksUnvalidated([
            { _id: "first", name: "First", faction: { name: "Crab", value: "crab" }, conflictCards: [], dynastyCards: [], provinceCards: [], role: [], stronghold: [] },
            { _id: "second", name: "Second", faction: { name: "Crab", value: "crab" }, conflictCards: [], dynastyCards: [], provinceCards: [], role: [], stronghold: [] }
        ]));
        expect(store.getState().cards.selectedDeck?._id).toBe("first");
        expect(store.getState().cards.decksValidating).toBe(true);
    });
});
