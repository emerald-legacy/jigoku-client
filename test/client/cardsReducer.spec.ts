import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import cardsReducer, { selectDeck, addDeck, updateDeck } from "../../client/reducers/cards";

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
        store.dispatch({
            type: "RECEIVE_CARDS",
            response: { cards: { c1: { id: "c1", type: "character", side: "dynasty", name: "Card 1" } } }
        });
        store.dispatch({
            type: "RECEIVE_FACTIONS",
            response: { factions: [{ name: "Crab", value: "crab" }] }
        });
    });

    it("RECEIVE_DECKS sets the deck list and selects the first", () => {
        store.dispatch({
            type: "RECEIVE_DECKS",
            response: {
                decks: [
                    { _id: "a", name: "A", faction: { name: "Crab", value: "crab" } },
                    { _id: "b", name: "B", faction: { name: "Crab", value: "crab" } }
                ]
            }
        });
        const state = store.getState().cards;
        expect(state.decks?.length).toBe(2);
        expect(state.selectedDeck?._id).toBe("a");
    });

    it("selectDeck sets the chosen deck as selectedDeck", () => {
        store.dispatch({
            type: "RECEIVE_DECKS",
            response: {
                decks: [
                    { _id: "a", name: "A", faction: { name: "Crab", value: "crab" } },
                    { _id: "b", name: "B", faction: { name: "Crab", value: "crab" } }
                ]
            }
        });
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
});
