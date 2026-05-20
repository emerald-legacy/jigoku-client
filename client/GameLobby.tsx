import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";

import NewGame from "./NewGame";
import GameList from "./GameList";
import GameStats from "./GameStats";
import PendingGame from "./PendingGame";
import PasswordGame from "./PasswordGame";
import AlertPanel from "./SiteComponents/AlertPanel";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";
import type { GameState, MenuItem } from "./types/game";

interface InnerGameLobbyProps {
    bannerNotice?: string;
    currentGame?: GameState;
    gameStats?: any;
    games: any[];
    newGame?: boolean;
    passwordGame?: any;
    loadGameStats: () => any;
    setContextMenu: (menu: MenuItem[]) => any;
    startNewGame: () => any;
    username?: string;
}

export function InnerGameLobby({ bannerNotice, currentGame, gameStats, games, newGame, passwordGame, loadGameStats, setContextMenu, startNewGame, username }: InnerGameLobbyProps) {
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    useEffect(() => {
        if(!currentGame) {
            setContextMenu([]);
        }
    }, [currentGame, setContextMenu]);

    useEffect(() => {
        if(username) {
            setErrorMessage(undefined);
        }
    }, [username]);

    useEffect(() => {
        loadGameStats();
    }, [loadGameStats]);

    const onNewGameClick = (event: React.MouseEvent) => {
        event.preventDefault();

        if(!username) {
            setErrorMessage("Please login before trying to start a new game");
            return;
        }

        startNewGame();
    };

    let rightside = null;

    if(passwordGame) {
        rightside = <PasswordGame />;
    } else if(currentGame) {
        rightside = <PendingGame />;
    }

    return (
        <div className="full-height">
            { bannerNotice ? <AlertPanel type="error" message={ bannerNotice } /> : null }
            { errorMessage ? <AlertPanel type="error" message={ errorMessage } /> : null }

            <div className="row h-full">
                <div className="col-sm-7 full-height relative">
                    <div className="panel-title text-center">
                        Current Games
                    </div>
                    <div className="panel game-list-container">
                        <button className="btn btn-primary" onClick={ onNewGameClick } disabled={ !!currentGame }>New Game</button>
                        { games.length === 0 ? <h4>No games are currently in progress</h4> : <GameList games={ games } /> }
                    </div>
                </div>
                <div className="col-sm-5">
                    { (!currentGame && newGame) ? <NewGame defaultGameName={ `${username}'s game` } /> : null }
                    { rightside }
                    <GameStats stats={ gameStats } />
                </div>
            </div>
        </div>
    );
}

InnerGameLobby.displayName = "GameLobby";

function mapStateToProps(state: RootState) {
    return {
        bannerNotice: state.chat.notice,
        currentGame: state.games.currentGame,
        gameStats: state.games.gameStats,
        isAdmin: state.auth.isAdmin,
        games: state.games.games,
        newGame: state.games.newGame,
        passwordGame: state.games.passwordGame,
        username: state.auth.username
    };
}

export default function GameLobby() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    return <InnerGameLobby { ...props } { ...boundActions } />;
}
