import { combineReducers } from "@reduxjs/toolkit";
import navigation from "./navigation";
import auth from "./auth";
import cards from "./cards";
import games from "./games";
import socket from "./socket";
import chat from "./chat";
import news from "./news";
import api from "./api";
import admin from "./admin";
import user from "./user";
import serverVersion from "./serverVersion";
import gameErrors from "./gameErrors";

const rootReducer = combineReducers({
    navigation, auth, cards, games, socket, chat, news, api, admin, user, serverVersion, gameErrors
});

export default rootReducer;
