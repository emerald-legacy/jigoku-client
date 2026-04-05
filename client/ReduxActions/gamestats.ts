import axios from "axios";

export function loadGameStats() {
    return {
        types: ["REQUEST_GAME_STATS", "RECEIVE_GAME_STATS"] as const,
        shouldCallAPI: (state: any) => !state.games.gameStats,
        callAPI: async () => {
            const response = await axios.get("/api/gamestats");
            return response.data;
        }
    };
}
