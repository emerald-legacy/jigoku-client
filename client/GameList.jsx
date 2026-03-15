import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'sonner';
import GameModes from './GameModes';

import { X } from 'lucide-react';
import Avatar from './Avatar.jsx';
import * as actions from './actions';

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
        let firstPlayer = true;
        const gameRow = [];

        const players = game.players ? Object.values(game.players) : [];
        players.forEach((player) => {
            if(firstPlayer) {
                gameRow.push(
                    <span key={ `${game.id}-p1-avatar` } className='col-xs-4 col-sm-3 game-row-avatar'>
                        <span className='hidden-xs col-sm-3 game-row-avatar'>
                            <Avatar emailHash={ player.emailHash } forceDefault={ player.settings ? player.settings.disableGravatar : false } />
                        </span>
                        <span className='player-name col-sm-8'>{ player.name }</span>
                    </span>
                );
                gameRow.push(<span key={ `${game.id}-p1-icon` } className={ 'hidden-xs col-xs-1 game-icon icon-clan-' + player.faction } />);
                firstPlayer = false;
            } else {
                gameRow.push(<span key={ `${game.id}-vs` } className='col-xs-1 game-row-vs text-center'><b> vs </b></span>);
                gameRow.push(<span key={ `${game.id}-p2-icon` } className={ 'hidden-xs col-xs-1 game-icon icon-clan-' + player.faction } />);
                gameRow.push(
                    <span key={ `${game.id}-p2-avatar` } className='col-xs-4 col-sm-3 game-row-avatar'>
                        <span className='player-name col-sm-8'>{ player.name }</span>
                        <span className='hidden-xs game-row-avatar pull-right col-sm-3'>
                            <Avatar emailHash={ player.emailHash } forceDefault={ player.settings ? player.settings.disableGravatar : false } />
                        </span>
                    </span>
                );
            }
        });

        let gameTitle = '';

        if(game.needsPassword) {
            gameTitle += '\uD83D\uDD12 ';
        }

        if(game.gameMode === GameModes.Skirmish) {
            gameTitle += '[SKIRMISH] ';
        } else if(game.gameMode === GameModes.JadeEdict) {
            gameTitle += '[JADE] ';
        } else if(game.gameMode === GameModes.Stronghold) {
            gameTitle += '[IMPERIAL] ';
        } else if(game.gameMode === GameModes.Emerald) {
            gameTitle += '[EMERALD] ';
        } else if(game.gameMode === GameModes.Obsidian) {
            gameTitle += '[OBSIDIAN] ';
        } else if(game.gameMode === GameModes.Sanctuary) {
            gameTitle += '[SANCTUARY] ';
        }

        if(game.gameType) {
            gameTitle += '[' + game.gameType + '] ';
        }

        gameTitle += game.name;

        let gameModifier = '';
        if(game.gameMode === GameModes.Skirmish) {
            gameModifier = ' skirmish';
        } else if(game.gameMode === GameModes.JadeEdict) {
            gameModifier = ' jade';
        } else if(game.gameMode === GameModes.Stronghold) {
            gameModifier = ' imperial';
        } else if(game.gameMode === GameModes.Obsidian) {
            gameModifier = ' obsidian';
        } else if(game.gameMode === GameModes.Sanctuary) {
            gameModifier = ' sanctuary';
        }

        const playerCount = players.length;

        return (
            <div key={ game.id } className={ 'game-row' + gameModifier + (game.node && isAdmin ? ' ' + game.node : '') }>
                <span className='col-xs-12 game-title'>
                    { isAdmin ? <a href='#' onClick={ (event) => removeGame(event, game) }><X size={ 16 } /></a> : null }
                    <b>{ gameTitle }</b> { game.clocks && game.clocks.type !== 'none' ? <img src='/img/free-clock-icon-png.png' className='clock-icon' /> : null }
                </span>
                <div className='game-row-players'>{ gameRow }</div>
                <div className='col-xs-3 game-row-buttons pull-right'>
                    { (currentGame || playerCount === 2 || game.started) ?
                        null :
                        <button className='btn btn-primary pull-right' onClick={ (event) => joinGame(event, game) }>Join</button>
                    }
                    { canWatch(game) ?
                        <button className='btn btn-primary pull-right' onClick={ (event) => watchGame(event, game) }>Watch</button> : null }
                </div>
            </div>
        );
    });

    return (
        <div className='game-list'>
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
