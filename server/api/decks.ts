const db = require("../db.js");
const DeckService = require("../services/DeckService.js");
const DeckStatsService = require("../services/DeckStatsService.js");
const { computeDeckContentHash } = require("../services/deckHashUtil.js");
const { wrapAsync } = require("../util.js");

module.exports.init = function(server) {
    const deckService = new DeckService(db.getDb());
    const deckStatsService = new DeckStatsService(db.getDb());

    server.get("/api/decks/:id", wrapAsync(async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        if(!req.params.id || req.params.id === "") {
            return res.status(404).send({ message: "No such deck" });
        }

        const deck = await deckService.getById(req.params.id);

        if(!deck) {
            return res.status(404).send({ message: "No such deck" });
        }

        if(deck.username !== req.user.username) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        res.send({ success: true, deck: deck });
    }));

    server.get("/api/deckstats", wrapAsync(async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        const statsDocs = await deckStatsService.getByUsername(req.user.username);
        const stats = {};
        for(const doc of statsDocs) {
            stats[doc.deckId.toString()] = doc.stats;
        }

        res.send({ success: true, stats });
    }));

    server.get("/api/decks", wrapAsync(async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        const options: any = {};
        if(req.query.format) {
            options.format = req.query.format;
        }

        const decks = await deckService.findByUserName(req.user.username, options);
        res.send({ success: true, decks: decks });
    }));

    server.put("/api/decks/:id", wrapAsync(async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        const deck = await deckService.getById(req.params.id);

        if(!deck) {
            return res.status(404).send({ message: "No such deck" });
        }

        if(deck.username !== req.user.username) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        let parsed;
        try {
            parsed = JSON.parse(req.body.data);
        } catch(_e) {
            return res.status(400).send({ success: false, message: "Invalid request data" });
        }
        const data = { id: req.params.id, ...parsed };
        await deckService.update(data);

        const contentHash = computeDeckContentHash(data);
        await deckStatsService.upsertForDeck(req.params.id, req.user.username, contentHash);

        res.send({ success: true, message: "Saved" });
    }));

    server.post("/api/decks", wrapAsync(async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        const deckCount = await deckService.countByUserName(req.user.username);
        if(deckCount >= 50) {
            return res.status(400).send({
                success: false,
                message: "You have reached the maximum limit of 50 decks. Please delete some decks before creating new ones."
            });
        }

        let parsed;
        try {
            parsed = JSON.parse(req.body.data);
        } catch(_e) {
            return res.status(400).send({ success: false, message: "Invalid request data" });
        }
        const deck = { ...parsed, username: req.user.username };
        await deckService.create(deck);
        res.send({ success: true });
    }));

    server.delete("/api/decks/:id", wrapAsync(async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        const id = req.params.id;
        const deck = await deckService.getById(id);

        if(!deck) {
            return res.status(404).send({ success: false, message: "No such deck" });
        }

        if(deck.username !== req.user.username) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        await deckService.delete(id);
        await deckStatsService.deleteByDeckId(id);
        res.send({ success: true, message: "Deck deleted successfully", deckId: id });
    }));

    server.post("/api/decks/delete-batch", wrapAsync(async function(req, res) {
        if(!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        const deckIds = req.body.deckIds;
        if(!deckIds || !Array.isArray(deckIds) || deckIds.length === 0) {
            return res.status(400).send({ success: false, message: "Invalid deck IDs" });
        }

        if(deckIds.length > 100) {
            return res.status(400).send({ success: false, message: "Cannot delete more than 100 decks at once" });
        }

        const decks = await deckService.findByIds(deckIds);

        if(decks.length !== deckIds.length) {
            return res.status(404).send({ success: false, message: "One or more decks not found" });
        }

        for(const deck of decks) {
            if(deck.username !== req.user.username) {
                return res.status(403).send({ success: false, message: "Unauthorized" });
            }
        }

        await deckService.deleteMany(deckIds);
        await deckStatsService.deleteByDeckIds(deckIds);

        res.send({
            success: true,
            message: `Successfully deleted ${deckIds.length} deck(s)`,
            deckIds: deckIds
        });
    }));
};
