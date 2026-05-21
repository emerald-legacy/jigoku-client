import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "./types/redux";
import GameLobby from "./GameLobby";

const GameBoard = React.lazy(() => import("./GameBoard"));

export default function PlayRoute() {
    const currentGame = useSelector((state: RootState) => state.games.currentGame);
    if(currentGame && currentGame.started) {
        return <GameBoard />;
    }
    return <GameLobby />;
}
