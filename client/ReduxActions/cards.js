import axios from "axios";

export function loadCards() {
    return {
        types: ["REQUEST_CARDS", "RECEIVE_CARDS"],
        shouldCallAPI: (state) => {
            return !state.cards.cards;
        },
        callAPI: () => axios.get("/api/cards").then(response => response.data)
    };
}

export function loadPacks() {
    return {
        types: ["REQUEST_PACKS", "RECEIVE_PACKS"],
        shouldCallAPI: (state) => {
            return !state.cards.packs;
        },
        callAPI: () => axios.get("/api/packs").then(response => response.data)
    };
}

export function loadFactions() {
    return {
        types: ["REQUEST_FACTIONS", "RECEIVE_FACTIONS"],
        shouldCallAPI: (state) => {
            return !state.cards.factions;
        },
        callAPI: () => axios.get("/api/factions").then(response => response.data)
    };
}

export function loadFormats() {
    return {
        types: ["REQUEST_FORMATS", "RECEIVE_FORMATS"],
        shouldCallAPI: (state) => {
            return !state.cards.formats;
        },
        callAPI: () => axios.get("/api/formats").then(response => response.data)
    };
}
