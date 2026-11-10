import db from "../db.js";
import CardService from "../services/CardService.js";

// Every page load asks for the full card list, which only changes when card data is imported.
const CARDS_CACHE_MS = 5 * 60 * 1000;

export function init(server) {
    const cardService = new CardService(db.getDb());
    let cachedCards: { body: string; at: number } | undefined;

    server.get("/api/cards", async function(req, res, next) {
        try {
            if(!cachedCards || Date.now() - cachedCards.at > CARDS_CACHE_MS) {
                const cards = await cardService.getAllCards({ shortForm: true });
                const body = JSON.stringify({ success: true, cards: cards });
                if(!cards) {
                    return res.type("json").send(body);
                }
                cachedCards = { body, at: Date.now() };
            }
            res.type("json").send(cachedCards.body);
        } catch(err) {
            return next(err);
        }
    });

    server.get("/api/packs", async function(req, res, next) {
        try {
            const packs = await cardService.getAllPacks();
            res.send({ success: true, packs: packs });
        } catch(err) {
            return next(err);
        }
    });

    server.get("/api/factions", function(req, res) {
        const factions = [
            { name: "Crab Clan", value: "crab" },
            { name: "Crane Clan", value: "crane" },
            { name: "Dragon Clan", value: "dragon" },
            { name: "Lion Clan", value: "lion" },
            { name: "Phoenix Clan", value: "phoenix" },
            { name: "Scorpion Clan", value: "scorpion" },
            { name: "Unicorn Clan", value: "unicorn" }
        ];
        res.send({ success: true, factions: factions });
    });

    server.get("/api/formats", function(req, res) {
        const formats = [
            { name: "Emerald", value: "emerald" },
            { name: "Sanctuary", value: "sanctuary" },
            { name: "Stronghold", value: "stronghold" },
            { name: "Skirmish", value: "skirmish" },
            { name: "Obsidian", value: "obsidian" }
        ];
        res.send({ success: true, formats: formats });
    });
}
