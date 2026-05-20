import React, { useEffect, useMemo, useRef, useState } from "react";
import { bindActionCreators } from "@reduxjs/toolkit";
import Draggable from "react-draggable";

import type { AnimationEvent } from "./types/redux";
import type { GameState, Card as CardType, Ring as RingType, Player, MenuItem, Spectator, GameMessage, MessageFragment } from "./types/game";
import type { User } from "./types/user";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in commented-out sidebar stats feature
import PlayerStatsRow from "./GameComponents/PlayerStatsRow";
import PlayerHand from "./GameComponents/PlayerHand";
import GameSettingsModal from "./GameComponents/GameSettingsModal";
import OpponentBoardArea from "./GameComponents/OpponentBoardArea";
import MyBoardArea from "./GameComponents/MyBoardArea";
import ActivePlayerPrompt from "./GameComponents/ActivePlayerPrompt";
import CardZoom from "./GameComponents/CardZoom";
import Card from "./GameComponents/Card";
import Chat from "./GameComponents/Chat";
import Controls from "./GameComponents/Controls";
import { tryParseJSON } from "./util.js";
import { downloadGameLog } from "./GameComponents/gameLogSerializer.js";
import { getCardImageUrl } from "./cardImageUrl.js";

import * as actions from "./actions";
import { clearAnimation } from "./ReduxActions/game";
import { makeCardsInPlayGrouper } from "./selectors/cardsInPlay";
import HonorChangeOverlay from "./GameComponents/HonorChangeOverlay";
import CenterBar from "./GameComponents/CenterBar";
import PlayerSidebar from "./GameComponents/PlayerSidebar";
import { useAppDispatch, useAppSelector } from "./hooks";
import type { AppDispatch } from "./hooks";

type ActionFn = (...args: any[]) => any;

type ContextMenuOption =
    | { text: string; onClick: (...args: any[]) => any }
    | { text: string; popup: React.ReactNode };

export interface InnerGameBoardProps {
    cardToZoom?: any;
    cards?: Record<string, any>;
    currentGame?: GameState;
    pendingAnimations?: AnimationEvent[];
    user?: User;
    username?: string;
    dispatch: AppDispatch | ((action: any) => any);
    boundActions: Record<string, ActionFn>;
    sendGameMessage?: ActionFn;
    closeGameSocket?: ActionFn;
    setContextMenu?: ActionFn;
    zoomCard?: ActionFn;
    clearZoom?: ActionFn;
}

function getMessagesFromPlayers(messages: GameMessage[]) {
    return messages.filter(
        (message: GameMessage) => (message.message instanceof Array) && message.message.some((fragment: MessageFragment) => !!fragment.name)
    );
}

function computeImageUrl(card?: CardType) {
    if(!card || !card.id) {
        return "";
    }
    if(card.facedownId) {
        return getCardImageUrl(card.facedownId, card.facedownPackId);
    }
    return getCardImageUrl(card.id, card.packId);
}

export function InnerGameBoard(props: InnerGameBoardProps) {
    const { cardToZoom, cards, currentGame, pendingAnimations, user, username, dispatch, boundActions } = props;

    const sendGameMessage = (props.sendGameMessage ?? boundActions.sendGameMessage) as ActionFn;
    const closeGameSocket = (props.closeGameSocket ?? boundActions.closeGameSocket) as ActionFn;
    const setContextMenu = (props.setContextMenu ?? boundActions.setContextMenu) as ActionFn;
    const zoomCard = (props.zoomCard ?? boundActions.zoomCard) as ActionFn;
    const clearZoom = (props.clearZoom ?? boundActions.clearZoom) as ActionFn;

    const [showChat, setShowChat] = useState(true);
    const [showChatAlert, setShowChatAlert] = useState(false);
    const [showConflictDeck, setShowConflictDeck] = useState(false);
    const [showDynastyDeck, setShowDynastyDeck] = useState(false);
    const [spectating, setSpectating] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const draggableRef = useRef<any>(null);
    const opponentDraggableRef = useRef<any>(null);
    const prevPlayerMsgCount = useRef(0);

    const groupCardsInPlayForMe = useMemo(() => makeCardsInPlayGrouper(), []);
    const groupCardsInPlayForOther = useMemo(() => makeCardsInPlayGrouper(), []);

    const isGameActive = () => {
        if(!currentGame || currentGame.winner) {
            return false;
        }
        let thisPlayer = currentGame.players[username];
        if(!thisPlayer) {
            thisPlayer = Object.values(currentGame.players).sort((a, b) => a.name.localeCompare(b.name))[0];
        }
        const otherPlayer = Object.values(currentGame.players).find(p => p.name !== thisPlayer.name);
        if(!otherPlayer || otherPlayer.disconnected || otherPlayer.left) {
            return false;
        }
        return true;
    };

    const onConcedeClick = () => sendGameMessage("concede");

    const onLeaveClick = () => {
        if(!spectating && isGameActive()) {
            if(window.confirm("Your game is not finished, are you sure you want to leave?")) {
                sendGameMessage("leavegame");
                closeGameSocket();
            }
            return;
        }
        sendGameMessage("leavegame");
        closeGameSocket();
    };

    const onMouseOver = (card: MessageFragment) => zoomCard(card);
    const onMouseOut = () => clearZoom();

    const onCardClick = (card: CardType & { controller?: any; isProvince?: boolean }) => {
        if(card && card.uuid) {
            sendGameMessage("cardClicked", card.uuid);
        } else if(card && card.location && card.controller) {
            sendGameMessage("facedownCardClicked", card.location, card.controller.name, card.isProvince);
        }
    };

    const onRingClick = (ring: string) => sendGameMessage("ringClicked", ring);

    const onConflictClick = () => {
        sendGameMessage("showConflictDeck");
        setShowConflictDeck(prev => !prev);
    };

    const onDynastyClick = () => {
        sendGameMessage("showDynastyDeck");
        setShowDynastyDeck(prev => !prev);
    };

    const sendMessage = (message: string) => {
        if(message === "") {
            return;
        }
        sendGameMessage("chat", message);
    };

    const onConflictShuffleClick = () => sendGameMessage("shuffleConflictDeck");
    const onDynastyShuffleClick = () => sendGameMessage("shuffleDynastyDeck");

    const onDragDrop = (card: CardType, source: string, target: string) =>
        sendGameMessage("drop", card.uuid, source, target);

    const onCommand = (command: string, arg: any, uuid: string, method: string) =>
        sendGameMessage(command, arg, uuid, method);

    const onDragOver = (event: React.DragEvent) => event.preventDefault();

    const onDragDropEvent = (event: React.DragEvent, target: string) => {
        event.stopPropagation();
        event.preventDefault();
        const card = event.dataTransfer.getData("Text");
        if(!card) {
            return;
        }
        const dragData = tryParseJSON(card);
        if(!dragData) {
            return;
        }
        onDragDrop(dragData.card, dragData.source, target);
    };

    const onMenuItemClick = (card: CardType, menuItem: MenuItem) =>
        sendGameMessage("menuItemClick", card.uuid, menuItem);

    const onRingMenuItemClick = (ring: RingType, menuItem: MenuItem) =>
        sendGameMessage("ringMenuItemClick", ring, menuItem);

    const onPromptedActionWindowToggle = (option: string, value: boolean) =>
        sendGameMessage("togglePromptedActionWindow", option, value);

    const onTimerSettingToggle = (option: string, value: boolean) =>
        sendGameMessage("toggleTimerSetting", option, value);

    const onOptionSettingToggle = (option: string, value: any) =>
        sendGameMessage("toggleOptionSetting", option, value);

    const onTimerExpired = () => sendGameMessage("menuButton", null, "pass");

    const onSettingsClick = (event: React.MouseEvent) => {
        event.preventDefault();
        setShowSettingsModal(true);
    };

    const onToggleChatClick = (event: React.MouseEvent) => {
        event.preventDefault();
        setShowChat(prev => !prev);
        setShowChatAlert(prev => showChat && prev);
    };

    const onManualModeClick = (event: React.MouseEvent) => {
        event.preventDefault();
        sendGameMessage("toggleManualMode");
    };

    const onDownloadLogClick = () => {
        if(currentGame) {
            downloadGameLog(currentGame, username);
        }
    };

    useEffect(() => {
        if(!currentGame) {
            return;
        }

        const thisPlayer = currentGame.players[username];
        setSpectating(!thisPlayer);

        if(thisPlayer && thisPlayer.selectCard) {
            document.body.classList.add("select-cursor");
        } else {
            document.body.classList.remove("select-cursor");
        }

        if(!setContextMenu) {
            return;
        }

        const menuOptions: ContextMenuOption[] = [
            { text: "Leave Game", onClick: onLeaveClick }
        ];

        if(currentGame.started) {
            if(Object.values<any>(currentGame.players).find(p => p.name === username)) {
                menuOptions.unshift({ text: "Concede", onClick: onConcedeClick });
            }

            const spectators = currentGame.spectators.map((spectator: Spectator) => (
                <li key={ spectator.name }>{ spectator.name }</li>
            ));

            const spectatorPopup = (
                <ul className="spectators-popup absolute-panel">
                    { spectators }
                </ul>
            );

            menuOptions.unshift({ text: `Spectators: ${currentGame.spectators.length}`, popup: spectatorPopup });
            setContextMenu(menuOptions);
        } else {
            setContextMenu([]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handler closures stable; deps mirror old componentDidUpdate guard
    }, [currentGame, username]);

    useEffect(() => {
        if(!currentGame) {
            return;
        }
        const currentCount = getMessagesFromPlayers(currentGame.messages || []).length;
        if(!showChat && currentCount > prevPlayerMsgCount.current) {
            setShowChatAlert(true);
        }
        prevPlayerMsgCount.current = currentCount;
    }, [currentGame, showChat]);

    if(!currentGame) {
        return <div>Waiting for server...</div>;
    }

    let thisPlayer = currentGame.players[username];
    if(!thisPlayer) {
        thisPlayer = Object.values(currentGame.players).sort((a, b) => a.name.localeCompare(b.name))[0];
    }
    if(!thisPlayer) {
        return <div>Waiting for game to have players or close...</div>;
    }

    const otherPlayer = Object.values(currentGame.players).find(p => p.name !== thisPlayer.name);
    const manualMode = currentGame.manualMode;

    const buildCardsInPlay = (player: Player & { id?: string }, isMe: boolean): React.ReactNode[][] => {
        if(!player) {
            return [];
        }
        const conflict = currentGame.conflict;
        const cardSize = user.settings.cardSize;
        const disableCardStats = user.settings.optionSettings.disableCardStats;
        const grouper = isMe ? groupCardsInPlayForMe : groupCardsInPlayForOther;
        const cardsByType = grouper(player.cardPiles.cardsInPlay, isMe);
        const playerIsDefending = !!(player && conflict.defendingPlayerId && player.id && player.id.includes(conflict.defendingPlayerId));
        const playerDeclaringParticipants = conflict && (!conflict.declarationComplete || (playerIsDefending && !conflict.defendersChosen));
        const onAnimationEnd = (uuid: string) => dispatch(clearAnimation(uuid));

        return cardsByType.map((cardGroup: CardType[]) => cardGroup.map((card: CardType) => (
            <Card
                key={ card.uuid }
                id={ card.uuid }
                source="play area"
                card={ card }
                disableMouseOver={ card.facedown && !card.code }
                onMenuItemClick={ onMenuItemClick }
                onMouseOver={ onMouseOver }
                onMouseOut={ onMouseOut }
                showStats={ !disableCardStats }
                player={ player }
                onClick={ onCardClick }
                onDragDrop={ onDragDrop }
                size={ cardSize }
                isMe={ isMe }
                declaring={ playerDeclaringParticipants }
                pendingAnimations={ pendingAnimations }
                onAnimationEnd={ onAnimationEnd }
            />
        )));
    };

    const thisPlayerCards: React.ReactNode[] = [];
    let index = 0;
    buildCardsInPlay(thisPlayer, true).forEach((cardRow: React.ReactNode) => {
        thisPlayerCards.push(
            <div className={ `card-row our-side player-home${thisPlayer.imperialFavor ? " favor" : ""}` } key={ `this-loc${index++}` }>
                { cardRow }
            </div>
        );
    });

    const otherPlayerCards: React.ReactNode[] = [];
    if(otherPlayer) {
        buildCardsInPlay(otherPlayer, false).forEach((cardRow: React.ReactNode) => {
            otherPlayerCards.push(
                <div className={ `card-row player-home${otherPlayer.imperialFavor ? " favor" : ""}` } key={ `other-loc${index++}` }>
                    { cardRow }
                </div>
            );
        });
    }

    const renderPlayerHand = () => {
        if(spectating) {
            return null;
        }
        const defaultPosition = {
            x: (window.innerWidth / 2) - 240,
            y: (window.innerHeight / 2)
        };
        const handBounds = {
            left: 0,
            right: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - 490,
            top: 0,
            bottom: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - 160
        };
        return (
            <Draggable handle=".grip" nodeRef={ draggableRef } bounds={ handBounds } defaultPosition={ defaultPosition }>
                <div ref={ draggableRef } className="player-home-row-container">
                    <PlayerHand
                        cards={ thisPlayer.cardPiles.hand }
                        isMe={ !spectating }
                        onCardClick={ onCardClick }
                        onDragDrop={ onDragDrop }
                        onMouseOut={ onMouseOut }
                        onMouseOver={ onMouseOver }
                        cardSize={ user.settings.cardSize }
                        pendingAnimations={ pendingAnimations }
                        playerName={ thisPlayer.name }
                        onAnimationEnd={ (id: string) => dispatch(clearAnimation(id)) }
                    />
                </div>
            </Draggable>
        );
    };

    const renderOpponentHand = () => {
        if(!otherPlayer || !otherPlayer.cardPiles.hand) {
            return null;
        }
        const hasRevealedCards = otherPlayer.cardPiles.hand.some((c: CardType) => !c.facedown && c.id);
        if(!hasRevealedCards) {
            return null;
        }
        const defaultPosition = {
            x: (window.innerWidth / 2) - 240,
            y: 50
        };
        const handBounds = {
            left: 0,
            right: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - 490,
            top: 0,
            bottom: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - 160
        };
        return (
            <Draggable handle=".grip" nodeRef={ opponentDraggableRef } bounds={ handBounds } defaultPosition={ defaultPosition }>
                <div ref={ opponentDraggableRef } className="player-home-row-container opponent-hand-container">
                    <PlayerHand
                        cards={ otherPlayer.cardPiles.hand }
                        isMe
                        onCardClick={ onCardClick }
                        onDragDrop={ onDragDrop }
                        onMouseOut={ onMouseOut }
                        onMouseOver={ onMouseOver }
                        cardSize={ user.settings.cardSize }
                        pendingAnimations={ pendingAnimations }
                        playerName={ otherPlayer.name }
                        onAnimationEnd={ (id: string) => dispatch(clearAnimation(id)) }
                    />
                </div>
            </Draggable>
        );
    };

    return (
        <div className="game-board">
            <GameSettingsModal
                show={ showSettingsModal }
                thisPlayer={ thisPlayer }
                onClose={ () => setShowSettingsModal(false) }
                onPromptedActionWindowToggle={ onPromptedActionWindowToggle }
                onTimerSettingToggle={ onTimerSettingToggle }
                onOptionSettingToggle={ onOptionSettingToggle }
            />
            <HonorChangeOverlay
                animations={ pendingAnimations || [] }
                onDismiss={ () => {
                    for(const a of pendingAnimations || []) {
                        if(a.type === "honor") {
                            dispatch(clearAnimation(a.playerName));
                        }
                    }
                } }
            />
            <div className="inset-pane">
                <ActivePlayerPrompt
                    title={ thisPlayer.menuTitle }
                    buttons={ thisPlayer.buttons }
                    cards={ cards }
                    controls={ thisPlayer.controls }
                    promptTitle={ thisPlayer.promptTitle }
                    onButtonClick={ onCommand }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    user={ user }
                    onTimerExpired={ onTimerExpired }
                    phase={ thisPlayer.phase }
                />
            </div>
            { renderPlayerHand() }
            { renderOpponentHand() }
            <div className={ `main-window ${user.settings.cardSize}` }>
                <PlayerSidebar
                    thisPlayer={ thisPlayer }
                    otherPlayer={ otherPlayer }
                    cardSize={ user.settings.cardSize }
                    showRingEffects={ thisPlayer?.optionSettings?.showRingEffects }
                    gameMode={ currentGame.gameMode }
                    rings={ currentGame.rings }
                    spectating={ spectating }
                    manualMode={ manualMode }
                    boundActions={ boundActions }
                    onRingClick={ onRingClick }
                    onRingMenuItemClick={ onRingMenuItemClick }
                />
                <div className={ `play-area${user.settings.cardSize ? ` ${user.settings.cardSize}` : ""}` }>
                    <OpponentBoardArea
                        otherPlayer={ otherPlayer }
                        otherPlayerCards={ otherPlayerCards }
                        cardSize={ user.settings.cardSize }
                        gameMode={ currentGame.gameMode }
                        skirmishMode={ currentGame.skirmishMode }
                        onCardClick={ onCardClick }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onMenuItemClick={ onMenuItemClick }
                    />
                    <CenterBar
                        currentGame={ currentGame }
                        thisPlayer={ thisPlayer }
                        otherPlayer={ otherPlayer }
                        cardSize={ user.settings.cardSize }
                        showRingEffects={ thisPlayer?.optionSettings?.showRingEffects }
                        onRingClick={ onRingClick }
                        onRingMenuItemClick={ onRingMenuItemClick }
                        onCardClick={ onCardClick }
                        onDragDrop={ onDragDrop }
                        onMenuItemClick={ onMenuItemClick }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                    />
                    <MyBoardArea
                        thisPlayer={ thisPlayer }
                        thisPlayerCards={ thisPlayerCards }
                        cardSize={ user.settings.cardSize }
                        spectating={ spectating }
                        manualMode={ manualMode }
                        gameMode={ currentGame.gameMode }
                        skirmishMode={ currentGame.skirmishMode }
                        showConflictDeck={ showConflictDeck }
                        showDynastyDeck={ showDynastyDeck }
                        onCardClick={ onCardClick }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onMenuItemClick={ onMenuItemClick }
                        onDragDrop={ onDragDrop }
                        onConflictClick={ onConflictClick }
                        onDynastyClick={ onDynastyClick }
                        onConflictShuffleClick={ onConflictShuffleClick }
                        onDynastyShuffleClick={ onDynastyShuffleClick }
                        onDragOver={ onDragOver }
                        onDropToPlayArea={ event => onDragDropEvent(event, "play area") }
                    />
                </div>
                <div className="right-side">
                    <CardZoom
                        imageUrl={ cardToZoom ? computeImageUrl(cardToZoom) : "" }
                        orientation={ cardToZoom ? cardToZoom.type === "plot" ? "horizontal" : "vertical" : "vertical" }
                        show={ !!cardToZoom }
                        cardName={ cardToZoom ? cardToZoom.name : null }
                    />
                    <Chat
                        visible={ showChat }
                        messages={ currentGame.messages }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        sendMessage={ sendMessage }
                    />
                    <Controls
                        onSettingsClick={ onSettingsClick }
                        onManualModeClick={ onManualModeClick }
                        onDownloadLogClick={ onDownloadLogClick }
                        onToggleChatClick={ onToggleChatClick }
                        showDownloadLog={ !!currentGame.winner }
                        showChatAlert={ showChatAlert }
                        manualModeEnabled={ manualMode }
                        showManualMode={ !spectating }
                    />
                </div>
            </div>
        </div>
    );
}

export default function GameBoard() {
    const dispatch = useAppDispatch();
    const cardToZoom = useAppSelector(state => state.cards.zoomCard);
    const cards = useAppSelector(state => state.cards.cards);
    const currentGame = useAppSelector(state => state.games.currentGame);
    const pendingAnimations = useAppSelector(state => state.games.pendingAnimations);
    const user = useAppSelector(state => state.auth.user);
    const username = useAppSelector(state => state.auth.username);

    const boundActions = useMemo(
        () => bindActionCreators(actions as unknown as Record<string, ActionFn>, dispatch),
        [dispatch]
    );

    return (
        <InnerGameBoard
            cardToZoom={ cardToZoom }
            cards={ cards }
            currentGame={ currentGame }
            pendingAnimations={ pendingAnimations }
            user={ user }
            username={ username }
            dispatch={ dispatch }
            boundActions={ boundActions }
        />
    );
}
