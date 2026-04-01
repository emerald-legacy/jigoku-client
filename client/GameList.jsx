import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'sonner';
import GameModes from './GameModes';

import { X } from 'lucide-react';
import Avatar from './Avatar.jsx';
import * as actions from './actions';

const gameModeLabels = {
    [GameModes.Skirmish]: 'SKIRMISH',
    [GameModes.Stronghold]: 'IMPERIAL',
    [GameModes.Emerald]: 'EMERALD',
    [GameModes.Obsidian]: 'OBSIDIAN',
    [GameModes.Sanctuary]: 'SANCTUARY'
};

const gameModeModifiers = {
    [GameModes.Skirmish]: 'skirmish',
    [GameModes.Stronghold]: 'imperial',
    [GameModes.Obsidian]: 'obsidian',
    [GameModes.Sanctuary]: 'sanctuary'
};

export function InnerGameList({ currentGame, games, isAdmin, joinPasswordGame, socket, username }) {
    const joinGame = useCallback((event, game) => {
        event.preventDefault();

        if(!username) {
            toast.error('Please login before trying to join a game');
            return;
        }

        if(game.needsPassword) {
            joinPasswordGame(game, 'Join');
        } else {
            socket.emit('joingame', game.id);
        }
    }, [username, joinPasswordGame, socket]);

    const canWatch = useCallback((game) => {
        return !currentGame && game.allowSpectators;
    }, [currentGame]);

    const watchGame = useCallback((event, game) => {
        event.preventDefault();

        if(!username) {
            toast.error('Please login before trying to watch a game');
            return;
        }

        if(game.needsPassword) {
            joinPasswordGame(game, 'Watch');
        } else {
            socket.emit('watchgame', game.id);
        }
    }, [username, joinPasswordGame, socket]);

    const removeGame = useCallback((event, game) => {
        event.preventDefault();
        socket.emit('removegame', game.id);
    }, [socket]);

    const gameList = games?.map((game) => {
        const players = game.players ? Object.values(game.players) : [];
        const playerCount = players.length;
        const modeLabel = gameModeLabels[game.gameMode];
        const modeModifier = gameModeModifiers[game.gameMode] || '';

        return (
            <div key={ game.id } className={ `game-row${modeModifier ? ` ${modeModifier}` : ""}${game.node && isAdmin ? ` ${game.node}` : ""}` }>
                <div className="game-row-header">
                    { (isAdmin || (game.started && game.owner === username)) ? <a href='#' className="game-row-remove" onClick={ (event) => removeGame(event, game) }><X size={ 14 } /></a> : null }
                    { game.needsPassword ? <span className="game-badge game-badge-lock">{ '\uD83D\uDD12' }</span> : null }
                    { modeLabel ? <span className={ 'game-badge game-badge-mode' }>{ modeLabel }</span> : null }
                    { game.gameType ? <span className={ `game-badge game-badge-type-${game.gameType}` }>{ game.gameType }</span> : null }
                    { game.clocks && game.clocks.type !== 'none' ? <img src='/img/free-clock-icon-png.png' className="clock-icon" /> : null }
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

InnerGameList.displayName = 'GameList';
InnerGameList.propTypes = {
    currentGame: PropTypes.object,
    games: PropTypes.array,
    isAdmin: PropTypes.bool,
    joinPasswordGame: PropTypes.func,
    showNodes: PropTypes.bool,
    socket: PropTypes.object,
    username: PropTypes.string
};

function mapStateToProps(state) {
    return {
        currentGame: state.games.currentGame,
        isAdmin: state.auth.isAdmin,
        socket: state.socket.socket,
        username: state.auth.username
    };
}

const GameList = connect(mapStateToProps, actions)(InnerGameList);

export default GameList;
