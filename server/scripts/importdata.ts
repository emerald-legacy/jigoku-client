/*eslint no-console:0 */
const db = require("../db.js");
const fs = require("fs");

const CardService = require("../services/CardService.js");

async function main() {
    await db.connect("mongodb://127.0.0.1:27017/jigoku");
    const cardService = new CardService(db.getDb());

    const files = fs.readdirSync("fiveringdsdb-data/Pack");
    let totalCards = [];
    const packs = JSON.parse(fs.readFileSync("fiveringdsdb-data/Pack.json").toString());
    const types = JSON.parse(fs.readFileSync("fiveringdsdb-data/Type.json").toString());
    const clans = JSON.parse(fs.readFileSync("fiveringdsdb-data/Clan.json").toString());

    files.forEach(file => {
        const card = JSON.parse(fs.readFileSync("fiveringdsdb-data/Card/" + file).toString());
        totalCards = totalCards.concat(card);
    });

    totalCards.forEach(card => {
        const cardsByName = totalCards.filter(filterCard => filterCard.name === card.code);

        if(cardsByName.length > 1) {
            card.name = card.code + " (" + card.pack_code + ")";
        } else {
            card.name = card.code;
        }

        const clan = clans.find(c => c.code === card.clan_code);
        const type = types.find(t => t.code === card.type);

        if(clan) {
            card.clan_name = clan.name;
        } else {
            console.info(clan, card.clan_code);
        }

        if(type) {
            card.type_name = type.name;
        } else {
            console.info(card.type);
        }
    });

    await cardService.replacePacks(packs);
    console.info(packs.length + " packs imported");

    await cardService.replaceCards(totalCards);
    console.info(totalCards.length + " cards imported");

    await db.close();
}

main().catch(err => {
    console.error("Error importing data:", err);
    db.close();
    process.exit(1);
});
