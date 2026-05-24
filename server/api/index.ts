import * as account from "./account.js";
import * as decks from "./decks.js";
import * as cards from "./cards.js";
import * as gamestats from "./gamestats.js";
import * as news from "./news.js";
import * as user from "./user.js";
import * as gameErrors from "./gameErrors.js";

export function init(server) {
    account.init(server);
    decks.init(server);
    cards.init(server);
    gamestats.init(server);
    news.init(server);
    user.init(server);
    gameErrors.init(server);
}
