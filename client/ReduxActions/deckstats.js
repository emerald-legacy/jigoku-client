import axios from "axios";

export function loadDeckStats() {
    return {
        types: ["REQUEST_DECK_STATS", "RECEIVE_DECK_STATS"],
        shouldCallAPI: () => true,
        callAPI: async () => {
            const response = await axios.get("/api/deckstats");
            return response.data;
        }
    };
}
