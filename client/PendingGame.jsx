import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import DeckRow from './DeckRow.jsx';
import Messages from './GameComponents/Messages.jsx';
import Avatar from './Avatar.jsx';
import DeckStatus from './DeckStatus.jsx';

import * as actions from './actions';

export function InnerPendingGame({
    apiError,
    connecting,
    currentGame,
    decks,
    gameSocketClose,
    host,
    loadDecks,
    loading,
    sendSocketMessage,
    socket,
    username,
    zoomCard
}) {
    const notificationRef = useRef(null);
    const messagePanelRef = useRef(null);
    const prevPlayersRef = useRef(null);

    const [playerCount, setPlayerCount] = useState(1);
    const [playSound, setPlaySound] = useState(true);
    const [message, setMessage] = useState('');
    const [decksLoading, setDecksLoading] = useState(true);
    const [waiting, setWaiting] = useState(false);
    const [filteredDecks, setFilteredDecks] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (event) => {
            if(event.key === 'Escape' && showModal) {
                setShowModal(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showModal]);

    useEffect(() => {
        const format = currentGame ? currentGame.gameMode : null;
        loadDecks(format);
    }, [loadDecks, currentGame]);

    useEffect(() => {
        const players = currentGame?.players ? Object.keys(currentGame.players).length : 0;
        const prevPlayers = prevPlayersRef.current;
        prevPlayersRef.current = players;

        if(prevPlayers === 1 && players === 2 && currentGame.owner === username) {
            if(notificationRef.current) {
                notificationRef.current.play();
            }
        }

        if(prevPlayers !== players) {
            setPlayerCount(players);
        }
    }, [currentGame, username]);

    useEffect(() => {
        if(connecting) {
            setWaiting(false);
        }
    }, [connecting]);

    useEffect(() => {
        if(messagePanelRef.current) {
            messagePanelRef.current.scrollTop = 999999;
        }
    });

    const isGameReady = useCallback(() => {
        if(!currentGame?.players) {
            return false;
        }

        const allPlayersHaveDecks = Object.values(currentGame.players).every(player => !!player.deck?.selected);
        if(!allPlayersHaveDecks) {
            return false;
        }

        return currentGame.owner === username;
    }, [currentGame, username]);

    const handleSelectDeckClick = useCallback(() => {
        setFilteredDecks(decks || []);
        setShowModal(true);
    }, [decks]);

    const selectDeck = useCallback((index) => {
        setShowModal(false);
        socket.emit('selectdeck', currentGame.id, filteredDecks[index]);
    }, [socket, currentGame, filteredDecks]);

    const getPlayerStatus = useCallback((player) => {
        const playerIsMe = player && player.name === username;

        let deck = null;
        let selectLink = null;
        let status = null;

        if(player && player.deck && player.deck.selected) {
            if(playerIsMe) {
                deck = <span className='deck-selection clickable' onClick={ handleSelectDeckClick }>{ player.deck.name }</span>;
            } else {
                deck = <span className='deck-selection'>Deck Selected</span>;
            }

            status = <DeckStatus deck={ player.deck } />;
        } else if(player && playerIsMe) {
            selectLink = <span className='card-link' onClick={ handleSelectDeckClick }>Select deck...</span>;
        }

        return (
            <div className='player-row' key={ player.name }>
                <Avatar emailHash={ player.emailHash } forceDefault={ player.settings ? player.settings.disableGravatar : false } /><span>{ player.name }</span>{ deck } { status } { selectLink }
            </div>
        );
    }, [username, handleSelectDeckClick]);

    const getGameStatus = useCallback(() => {
        if(connecting) {
            return 'Connecting to game server: ' + host;
        }

        if(waiting) {
            return 'Waiting for lobby server...';
        }

        const playerSize = currentGame?.players ? Object.keys(currentGame.players).length : 0;
        if(playerSize < 2) {
            return 'Waiting for players...';
        }

        const allPlayersHaveDecks = Object.values(currentGame.players).every(player => !!player.deck?.selected);
        if(!allPlayersHaveDecks) {
            return 'Waiting for players to select decks';
        }

        return 'Ready to begin, click start to begin the game';
    }, [connecting, host, waiting, currentGame]);

    const handleLeaveClick = useCallback((event) => {
        event.preventDefault();
        socket.emit('leavegame', currentGame.id);
        gameSocketClose();
    }, [socket, currentGame, gameSocketClose]);

    const handleStartClick = useCallback((event) => {
        event.preventDefault();
        setWaiting(true);
        socket.emit('startgame', currentGame.id);
    }, [socket, currentGame]);

    const sendMessage = useCallback(() => {
        if(message === '') {
            return;
        }

        sendSocketMessage('chat', message);
        setMessage('');
    }, [message, sendSocketMessage]);

    const handleKeyPress = useCallback((event) => {
        if(event.key === 'Enter') {
            sendMessage();
            event.preventDefault();
        }
    }, [sendMessage]);

    const handleSendClick = useCallback((event) => {
        event.preventDefault();
        sendMessage();
    }, [sendMessage]);

    const handleChange = useCallback((event) => {
        setMessage(event.target.value);
    }, []);

    const handleMouseOver = useCallback((card) => {
        zoomCard(card);
    }, [zoomCard]);

    const getClock = useCallback(() => {
        const game = currentGame;
        if(!game.clocks || game.clocks.type === 'none') {
            return;
        }
        if(game.clocks.type === 'byoyomi') {
            return `Clock: ${game.clocks.time} mins + ${game.clocks.periods} x ${game.clocks.timePeriod} secs (byoyomi)`;
        }
        return 'Clock: ' + game.clocks.time + ' mins (' + (game.clocks.type) + ')';
    }, [currentGame]);

    const renderedDecks = useMemo(() => {
        if(loading) {
            return <div>Loading decks from the server...</div>;
        }
        if(apiError) {
            return <AlertPanel type='error' message={ apiError } />;
        }
        if(filteredDecks.length > 0) {
            return filteredDecks.map((deck, index) => (
                <DeckRow key={ deck.name + index.toString() } deck={ deck } onClick={ () => selectDeck(index) } />
            ));
        }
        return <div>You have no decks for this format, please add one</div>;
    }, [loading, apiError, filteredDecks, selectDeck]);

    if(currentGame && currentGame.started) {
        return <div>Loading game in progress, please wait...</div>;
    }

    const game = currentGame;

    const handleModalClick = useCallback((event) => {
        // Close modal when clicking the overlay (outside the modal-dialog)
        if(event.target === event.currentTarget) {
            setShowModal(false);
        }
    }, []);

    const popup = (
        <div
            className={ `modal fade ${showModal ? 'in' : ''}` }
            style={ { display: showModal ? 'block' : 'none' } }
            tabIndex='-1'
            role='dialog'
            onClick={ handleModalClick }
        >
            <div className='modal-dialog' role='document'>
                <div className='modal-content deck-popup'>
                    <div className='modal-header'>
                        <button type='button' className='close' aria-label='Close' onClick={ () => setShowModal(false) } style={ { fontSize: '28px', opacity: 1, color: '#fff', textShadow: 'none' } }><span aria-hidden='true'>&times;</span></button>
                        <h4 className='modal-title'>Select Deck</h4>
                    </div>
                    <div className='modal-body'>
                        <div className='deck-list-popup'>
                            { renderedDecks }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const backdrop = showModal ? <div className='modal-backdrop fade in' onClick={ () => setShowModal(false) } /> : null;

    return (
        <div>
            <audio ref={ notificationRef }>
                <source src='/sound/charge.mp3' type='audio/mpeg' />
                <source src='/sound/charge.ogg' type='audio/ogg' />
            </audio>
            <div className='panel-title text-center'>
                { currentGame.name }
            </div>
            <div className='panel'>
                <div className='row-flex-box'>
                    <div className='column-flex-box'>
                        <div className='btn-group'>
                            <button className='btn btn-primary' disabled={ !isGameReady() || connecting || waiting } onClick={ handleStartClick }>Start</button>
                            <button className='btn btn-primary' onClick={ handleLeaveClick }>Leave</button>
                        </div>
                        <div className='game-status'>{ getGameStatus() }</div>
                    </div>
                    <div className='column-flex-box'>
                        <div>
                            { 'Spectators allowed: ' + (game.allowSpectators ? 'Yes' : 'No') }
                        </div>
                        <div>
                            { game.allowSpectators ? 'Spectators can chat: ' + (game.spectatorSquelch ? 'No' : 'Yes') : null }
                        </div>
                        <div>
                            { getClock() }
                        </div>
                    </div>
                </div>
            </div>
            <div className='panel-title text-center'>
                Players
            </div>
            <div className='players panel'>
                { currentGame.players && Object.values(currentGame.players).map(player => getPlayerStatus(player)) }
            </div>
            <div className='panel-title text-center'>
                Spectators ({ currentGame.spectators.length })
            </div>
            <div className='spectators panel'>
                { currentGame.spectators.map(spectator => (
                    <div key={ spectator.name }>{ spectator.name }</div>
                )) }
            </div>
            <div className='panel-title text-center'>
                Chat</div>
            <div className='chat-box panel'>
                <div className='message-list' ref={ messagePanelRef }>
                    <Messages messages={ currentGame.messages } onCardMouseOver={ handleMouseOver } onCardMouseOut={ handleMouseOver } />
                </div>
                <form className='form form-horizontal'>
                    <div className='form-group'>
                        <input className='form-control' type='text' placeholder='Enter a message...' value={ message }
                            onKeyPress={ handleKeyPress } onChange={ handleChange } />
                    </div>
                </form>
            </div>
            { popup }
            { backdrop }
        </div>
    );
}

InnerPendingGame.displayName = 'PendingGame';
InnerPendingGame.propTypes = {
    apiError: PropTypes.string,
    connecting: PropTypes.bool,
    currentGame: PropTypes.object,
    decks: PropTypes.array,
    gameSocketClose: PropTypes.func,
    host: PropTypes.string,
    loadDecks: PropTypes.func,
    loading: PropTypes.bool,
    sendSocketMessage: PropTypes.func,
    socket: PropTypes.object,
    username: PropTypes.string,
    zoomCard: PropTypes.func
};

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        connecting: state.socket.gameConnecting,
        currentGame: state.games.currentGame,
        decks: state.cards.decks,

        host: state.socket.gameHost,
        loading: state.api.loading,
        socket: state.socket.socket,
        username: state.auth.username
    };
}

const PendingGame = connect(mapStateToProps, actions)(InnerPendingGame);

export default PendingGame;
