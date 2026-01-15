import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import NewGame from './NewGame.jsx';
import GameList from './GameList.jsx';
import PendingGame from './PendingGame.jsx';
import PasswordGame from './PasswordGame.jsx';
import AlertPanel from './SiteComponents/AlertPanel.jsx';

import * as actions from './actions';

export function InnerGameLobby({ bannerNotice, currentGame, games, newGame, passwordGame, setContextMenu, startNewGame, username }) {
    const [errorMessage, setErrorMessage] = useState(undefined);

    useEffect(() => {
        if (!currentGame) {
            setContextMenu([]);
        }
    }, [currentGame, setContextMenu]);

    useEffect(() => {
        if (username) {
            setErrorMessage(undefined);
        }
    }, [username]);

    const onNewGameClick = useCallback((event) => {
        event.preventDefault();

        if (!username) {
            setErrorMessage('Please login before trying to start a new game');
            return;
        }

        startNewGame();
    }, [username, startNewGame]);

    let rightside = null;

    if (passwordGame) {
        rightside = <PasswordGame />;
    } else if (currentGame) {
        rightside = <PendingGame />;
    }

    return (
        <div className='full-height'>
            {bannerNotice ? <AlertPanel type='error' message={bannerNotice} /> : null}
            {errorMessage ? <AlertPanel type='error' message={errorMessage} /> : null}

            <div className='col-sm-7 full-height'>
                <div className='panel-title text-center'>
                    Current Games
                </div>
                <div className='panel game-list-container'>
                    <button className='btn btn-primary' onClick={onNewGameClick} disabled={!!currentGame}>New Game</button>
                    {games.length === 0 ? <h4>No games are currently in progress</h4> : <GameList games={games} />}
                </div>
            </div>
            <div className='col-sm-5'>
                {(!currentGame && newGame) ? <NewGame defaultGameName={username + '\'s game'} /> : null}
                {rightside}
            </div>
        </div>
    );
}

InnerGameLobby.displayName = 'GameLobby';
InnerGameLobby.propTypes = {
    bannerNotice: PropTypes.string,
    currentGame: PropTypes.object,
    games: PropTypes.array,
    isAdmin: PropTypes.bool,
    newGame: PropTypes.bool,
    passwordGame: PropTypes.object,
    setContextMenu: PropTypes.func,
    startNewGame: PropTypes.func,
    username: PropTypes.string
};

function mapStateToProps(state) {
    return {
        bannerNotice: state.chat.notice,
        currentGame: state.games.currentGame,
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
