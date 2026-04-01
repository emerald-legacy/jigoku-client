import { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';

import NewGame from './NewGame.jsx';
import GameList from './GameList.jsx';
import GameStats from './GameStats.jsx';
import PendingGame from './PendingGame.jsx';
import PasswordGame from './PasswordGame.jsx';
import AlertPanel from './SiteComponents/AlertPanel.jsx';

import * as actions from './actions';

export function InnerGameLobby({ bannerNotice, currentGame, gameStats, games, newGame, passwordGame, loadGameStats, setContextMenu, startNewGame, username }) {
    const [errorMessage, setErrorMessage] = useState(undefined);

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

    const onNewGameClick = useCallback((event) => {
        event.preventDefault();

        if(!username) {
            setErrorMessage('Please login before trying to start a new game');
            return;
        }

        startNewGame();
    }, [username, startNewGame]);

    let rightside = null;

    if(passwordGame) {
        rightside = <PasswordGame />;
    } else if(currentGame) {
        rightside = <PendingGame />;
    }

    return (
        <div className="full-height">
            { bannerNotice ? <AlertPanel type='error' message={ bannerNotice } /> : null }
            { errorMessage ? <AlertPanel type='error' message={ errorMessage } /> : null }

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

InnerGameLobby.displayName = 'GameLobby';

function mapStateToProps(state) {
    return {
        bannerNotice: state.chat.notice,
        currentGame: state.games.currentGame,
        gameStats: state.games.gameStats,
        isAdmin: state.auth.isAdmin,
        games: state.games.games,
        newGame: state.games.newGame,
        passwordGame: state.games.passwordGame,
        socket: state.socket.socket,
        username: state.auth.username
    };
}

const GameLobby = connect(mapStateToProps, actions)(InnerGameLobby);

export default GameLobby;
