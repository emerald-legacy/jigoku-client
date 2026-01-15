/*eslint no-console:0 */
const monk = require('monk').default;
const fs = require('fs');

const CardService = require('../services/CardService.js');

let db = monk('mongodb://127.0.0.1:27017/ringteki');
let cardService = new CardService(db);
let files = fs.readdirSync('fiveringdsdb-data/Pack');
let totalCards = [];
let packs = JSON.parse(fs.readFileSync('fiveringdsdb-data/Pack.json').toString());
let types = JSON.parse(fs.readFileSync('fiveringdsdb-data/Type.json').toString());
let clans = JSON.parse(fs.readFileSync('fiveringdsdb-data/Clan.json').toString());

files.forEach(file => {
    let card = JSON.parse(fs.readFileSync('fiveringdsdb-data/Card/' + file).toString());

    totalCards = totalCards.concat(card);
});

totalCards.forEach(card => {
    let cardsByName = totalCards.filter(filterCard => filterCard.name === card.code);

    if(cardsByName.length > 1) {
        card.name = card.code + ' (' + card.pack_code + ')';
    } else {
        card.name = card.code;
    }

    let clan = clans.find(c => c.code === card.clan_code);

    let type = types.find(t => t.code === card.type);

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

let replacePacks = cardService.replacePacks(packs)
    .then(packs => {
        console.info(packs.length + ' packs imported');
    });

let replaceCards = cardService.replaceCards(totalCards)
    .then(cards => {
        console.info(cards.length + ' cards imported');
    });

Promise.all([replacePacks, replaceCards])
    .then(() => db.close())
    .catch(() => db.close());
