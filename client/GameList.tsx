import React, { useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { toast } from "sonner";
import GameModes from "./GameModes";

import { X } from "lucide-react";
import Avatar from "./Avatar";
import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { GameState, UserSettings } from "./types/game";
import type { RootState } from "./types/redux";
import { getLobbySocket } from "./socket";

interface LobbyGamePlayer {
    name: string;
    emailHash?: string;
    faction?: string;
    settings?: UserSettings;
}

interface LobbyGame {
    id: string;
    name: string;
    owner?: string;
    started?: boolean;
    needsPassword?: boolean;
    allowSpectators?: boolean;
    gameMode?: string;
    gameType?: string;
    node?: string;
    clocks?: { type?: string };
    players?: Record<string, LobbyGamePlayer>;
}

interface InnerGameListProps {
    currentGame?: GameState;
    games?: LobbyGame[];
    isAdmin?: boolean;
    joinPasswordGame: (game: LobbyGame, action: string) => void;
    username?: string;
}

const gameModeLabels: Record<string, string> = {
    [GameModes.Skirmish]: "SKIRMISH",
    [GameModes.Stronghold]: "IMPERIAL",
    [GameModes.Emerald]: "EMERALD",
    [GameModes.Obsidian]: "OBSIDIAN",
    [GameModes.Sanctuary]: "SANCTUARY"
};

const gameModeModifiers: Record<string, string> = {
    [GameModes.Skirmish]: "skirmish",
    [GameModes.Stronghold]: "imperial",
    [GameModes.Obsidian]: "obsidian",
    [GameModes.Sanctuary]: "sanctuary"
};

export function InnerGameList({ currentGame, games, isAdmin, joinPasswordGame, username }: InnerGameListProps) {
    const joinGame = (event: React.MouseEvent, game: LobbyGame) => {
        event.preventDefault();

        if(!username) {
            toast.error("Please login before trying to join a game");
            return;
        }

        if(game.needsPassword) {
            joinPasswordGame(game, "Join");
        } else {
            getLobbySocket()?.emit("joingame", game.id);
        }
    };

    const canWatch = (game: LobbyGame) => {
        return !currentGame && game.allowSpectators;
    };

    const watchGame = (event: React.MouseEvent, game: LobbyGame) => {
        event.preventDefault();

        if(!username) {
            toast.error("Please login before trying to watch a game");
            return;
        }

        if(game.needsPassword) {
            joinPasswordGame(game, "Watch");
        } else {
            getLobbySocket()?.emit("watchgame", game.id);
        }
    };

    const removeGame = (event: React.MouseEvent, game: LobbyGame) => {
        event.preventDefault();
        getLobbySocket()?.emit("removegame", game.id);
    };

    const gameList = games?.map((game: LobbyGame) => {
        const players: LobbyGamePlayer[] = game.players ? Object.values<LobbyGamePlayer>(game.players) : [];
        const playerCount = players.length;
        const modeLabel = game.gameMode ? gameModeLabels[game.gameMode] : undefined;
        const modeModifier = (game.gameMode && gameModeModifiers[game.gameMode]) || "";

        return (
            <div key={ game.id } className={ `game-row${modeModifier ? ` ${modeModifier}` : ""}${game.node && isAdmin ? ` ${game.node}` : ""}` }>
                <div className="game-row-header">
                    { (isAdmin || (game.started && game.owner === username)) ? <a href="#" className="game-row-remove" onClick={ (event) => removeGame(event, game) }><X size={ 14 } /></a> : null }
                    { game.needsPassword ? <span className="game-badge game-badge-lock">{ "\uD83D\uDD12" }</span> : null }
                    { modeLabel ? <span className="game-badge game-badge-mode">{ modeLabel }</span> : null }
                    { game.gameType ? <span className={ `game-badge game-badge-type-${game.gameType}` }>{ game.gameType }</span> : null }
                    { game.clocks && game.clocks.type !== "none" ? <img src="/img/free-clock-icon-png.png" className="clock-icon" /> : null }
                    <span className="game-row-name">{ game.name }</span>
                </div>
                <div className="game-row-content">
                    <div className="game-row-players">
                        { players.map((player, i) => (
                            <span key={ player.name } className="game-row-player">
                                { i > 0 && <span className="game-row-vs">vs</span> }
                                <Avatar emailHash={ player.emailHash } forceDefault={ player.settings ? player.settings.disableGravatar : false } />
                                <span className="player-name">{ player.name }</span>
                                <span className={ `game-icon icon-clan-${player.faction}` } />
                            </span>
                        )) }
                        { playerCount === 0 && <span className="game-row-empty">Waiting for players...</span> }
                    </div>
                    <div className="game-row-buttons">
                        { canWatch(game) ?
                            <button className="btn btn-primary btn-sm" onClick={ (event) => watchGame(event, game) }>Watch</button> : null }
                        { (currentGame || playerCount === 2 || game.started) ?
                            null :
                            <button className="btn btn-primary btn-sm" onClick={ (event) => joinGame(event, game) }>Join</button>
                        }
                    </div>
                </div>
            </div>
        );
    });

    return (
        <div className="game-list">
            { gameList }
        </div>
    );
}

InnerGameList.displayName = "GameList";

function mapStateToProps(state: RootState) {
    return {
        currentGame: state.games.currentGame,
        isAdmin: state.auth.isAdmin,
        username: state.auth.username
    };
}

interface GameListOwnProps {
    games?: LobbyGame[];
}

export default function GameList(ownProps: GameListOwnProps) {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    return <InnerGameList { ...props } { ...boundActions } { ...ownProps } />;
}
