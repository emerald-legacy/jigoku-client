import { useState, useRef, useEffect } from "react";
import { connect } from "react-redux";

import AlertPanel from "./SiteComponents/AlertPanel.jsx";
import DeckRow from "./DeckRow.jsx";
import Messages from "./GameComponents/Messages.jsx";
import Avatar from "./Avatar.jsx";
import DeckStatus from "./DeckStatus.jsx";

import * as actions from "./actions";

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
    const [message, setMessage] = useState("");
    const [decksLoading, setDecksLoading] = useState(true);
    const [waiting, setWaiting] = useState(false);
    const [filteredDecks, setFilteredDecks] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (event) => {
            if(event.key === "Escape" && showModal) {
                setShowModal(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
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
    }, [currentGame?.messages]);

    const isGameReady = () => {
        if(!currentGame?.players) {
            return false;
        }

        const allPlayersHaveDecks = Object.values(currentGame.players).every(player => !!player.deck?.selected);
        if(!allPlayersHaveDecks) {
            return false;
        }

        return currentGame.owner === username;
    };

    const handleSelectDeckClick = () => {
        setFilteredDecks(decks || []);
        setShowModal(true);
    };

    const selectDeck = (index) => {
        setShowModal(false);
        socket.emit("selectdeck", currentGame.id, filteredDecks[index]);
    };

    const getPlayerStatus = (player) => {
        const playerIsMe = player && player.name === username;

        let deck = null;
        let selectLink = null;
        let status = null;

        if(player && player.deck && player.deck.selected) {
            if(playerIsMe) {
                deck = <span className="deck-selection clickable" onClick={ handleSelectDeckClick }>{ player.deck.name }</span>;
            } else {
                deck = <span className="deck-selection">Deck Selected</span>;
            }

            status = <DeckStatus deck={ player.deck } />;
        } else if(player && playerIsMe) {
            selectLink = <span className="card-link" onClick={ handleSelectDeckClick }>Select deck...</span>;
        }

        return (
            <div className="player-row" key={ player.name }>
                <Avatar emailHash={ player.emailHash } forceDefault={ player.settings ? player.settings.disableGravatar : false } />
                <span className="player-row-name">{ player.name }</span>
                { deck }
                { status }
                { selectLink }
            </div>
        );
    };

    const getGameStatus = () => {
        if(connecting) {
            return `Connecting to game server: ${host}`;
        }

        if(waiting) {
            return "Waiting for lobby server...";
        }

        const playerSize = currentGame?.players ? Object.keys(currentGame.players).length : 0;
        if(playerSize < 2) {
            return "Waiting for players...";
        }

        const allPlayersHaveDecks = Object.values(currentGame.players).every(player => !!player.deck?.selected);
        if(!allPlayersHaveDecks) {
            return "Waiting for players to select decks";
        }

        return "Ready to begin, click start to begin the game";
    };

    const handleLeaveClick = (event) => {
        event.preventDefault();
        socket.emit("leavegame", currentGame.id);
        gameSocketClose();
    };

    const handleStartClick = (event) => {
        event.preventDefault();
        setWaiting(true);
        socket.emit("startgame", currentGame.id);
    };

    const sendMessage = () => {
        if(message === "") {
            return;
        }

        sendSocketMessage("chat", message);
        setMessage("");
    };

    const handleKeyPress = (event) => {
        if(event.key === "Enter") {
            sendMessage();
            event.preventDefault();
        }
    };

    const handleSendClick = (event) => {
        event.preventDefault();
        sendMessage();
    };

    const handleChange = (event) => {
        setMessage(event.target.value);
    };

    const handleMouseOver = (card) => {
        zoomCard(card);
    };

    const getClock = () => {
        const game = currentGame;
        if(!game.clocks || game.clocks.type === "none") {
            return;
        }
        if(game.clocks.type === "byoyomi") {
            return `Clock: ${game.clocks.time} mins + ${game.clocks.periods} x ${game.clocks.timePeriod} secs (byoyomi)`;
        }
        return `Clock: ${game.clocks.time} mins (${game.clocks.type})`;
    };

    let renderedDecks;
    if(loading) {
        renderedDecks = <div>Loading decks from the server...</div>;
    } else if(apiError) {
        renderedDecks = <AlertPanel type="error" message={ apiError } />;
    } else if(filteredDecks.length > 0) {
        renderedDecks = filteredDecks.map((deck, index) => (
            <DeckRow key={ deck.name + index.toString() } deck={ deck } onClick={ () => selectDeck(index) } />
        ));
    } else {
        renderedDecks = <div>You have no decks for this format, please add one</div>;
    }

    const handleModalClick = (event) => {
        // Close modal when clicking the overlay (outside the modal-dialog)
        if(event.target === event.currentTarget) {
            setShowModal(false);
        }
    };

    if(currentGame && currentGame.started) {
        return <div>Loading game in progress, please wait...</div>;
    }

    const game = currentGame;

    const popup = (
        <div
            className={ `modal fade ${showModal ? "in" : ""}` }
            style={ { display: showModal ? "block" : "none" } }
            tabIndex="-1"
            role="dialog"
            onClick={ handleModalClick }
        >
            <div className="modal-dialog" role="document">
                <div className="modal-content deck-select-modal">
                    <div className="deck-select-header">
                        <span className="deck-select-title">Select Deck</span>
                        <button type="button" className="deck-select-close" aria-label="Close" onClick={ () => setShowModal(false) }>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="deck-select-list">
                            { renderedDecks }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const backdrop = showModal ? <div className="modal-backdrop fade in" onClick={ () => setShowModal(false) } /> : null;

    return (
        <div>
            <audio ref={ notificationRef }>
                <source src="/sound/charge.mp3" type="audio/mpeg" />
                <source src="/sound/charge.ogg" type="audio/ogg" />
            </audio>
            <div className="panel-title text-center">
                { currentGame.name }
            </div>
            <div className="panel">
                <div className="row-flex-box">
                    <div className="column-flex-box">
                        <div className="btn-group">
                            <button className="btn btn-primary" disabled={ !isGameReady() || connecting || waiting } onClick={ handleStartClick }>Start</button>
                            <button className="btn btn-primary" onClick={ handleLeaveClick }>Leave</button>
                        </div>
                        <div className="game-status">{ getGameStatus() }</div>
                    </div>
                    <div className="column-flex-box">
                        <div>
                            { `Spectators allowed: ${game.allowSpectators ? "Yes" : "No"}` }
                        </div>
                        <div>
                            { game.allowSpectators ? `Spectators can chat: ${game.spectatorSquelch ? "No" : "Yes"}` : null }
                        </div>
                        <div>
                            { getClock() }
                        </div>
                    </div>
                </div>
            </div>
            <div className="panel-title text-center">
                Players
            </div>
            <div className="players panel">
                { currentGame.players && Object.values(currentGame.players).map(player => getPlayerStatus(player)) }
            </div>
            <div className="panel-title text-center">
                Spectators ({ currentGame.spectators.length })
            </div>
            <div className="spectators panel">
                { currentGame.spectators.map(spectator => (
                    <div key={ spectator.name }>{ spectator.name }</div>
                )) }
            </div>
            <div className="panel-title text-center">
                Chat</div>
            <div className="chat-box panel">
                <div className="message-list" ref={ messagePanelRef }>
                    <Messages messages={ currentGame.messages } onCardMouseOver={ handleMouseOver } onCardMouseOut={ handleMouseOver } />
                </div>
                <form className="form form-horizontal">
                    <div className="form-group">
                        <input className="form-control" type="text" placeholder="Enter a message..." value={ message }
                            onKeyPress={ handleKeyPress } onChange={ handleChange } />
                    </div>
                </form>
            </div>
            { backdrop }
            { popup }
        </div>
    );
}

InnerPendingGame.displayName = "PendingGame";

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
