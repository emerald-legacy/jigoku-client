import React, { createRef } from "react";
import type { RefObject } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import type { Dispatch } from "@reduxjs/toolkit";
import Draggable from "react-draggable";

import type { RootState, AnimationEvent } from "./types/redux";
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

type ActionFn = (...args: any[]) => any;

interface GameBoardStateProps {
    cardToZoom?: any;
    cards?: Record<string, any>;
    currentGame?: GameState;
    pendingAnimations?: AnimationEvent[];
    user?: User;
    username?: string;
}

interface GameBoardDispatchProps {
    dispatch: Dispatch;
    clearZoom: ActionFn;
    closeGameSocket: ActionFn;
    sendGameMessage: ActionFn;
    setContextMenu: ActionFn;
    zoomCard: ActionFn;
}

type GameBoardProps = GameBoardStateProps & GameBoardDispatchProps;

interface GameBoardState {
    cardToZoom?: any;
    showChat: boolean;
    showChatAlert: boolean;
    showConflictDeck: boolean;
    showDynastyDeck: boolean;
    spectating: boolean;
    showActionWindowsMenu: boolean;
    showCardMenu: Record<string, boolean>;
    showSettingsModal: boolean;
}

export class InnerGameBoard extends React.Component<GameBoardProps, GameBoardState> {
    static displayName = "GameBoard";

    constructor(props: GameBoardProps) {
        super(props);

        this.draggableRef = createRef();
        this.opponentDraggableRef = createRef();

        this.onMouseOut = this.onMouseOut.bind(this);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onRingClick = this.onRingClick.bind(this);
        this.onCardClick = this.onCardClick.bind(this);
        this.onConflictClick = this.onConflictClick.bind(this);
        this.onDynastyClick = this.onDynastyClick.bind(this);
        this.onDragDrop = this.onDragDrop.bind(this);
        this.onCommand = this.onCommand.bind(this);
        this.onConcedeClick = this.onConcedeClick.bind(this);
        this.onLeaveClick = this.onLeaveClick.bind(this);
        this.onConflictShuffleClick = this.onConflictShuffleClick.bind(this);
        this.onDynastyShuffleClick = this.onDynastyShuffleClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.onRingMenuItemClick = this.onRingMenuItemClick.bind(this);
        this.onManualModeClick = this.onManualModeClick.bind(this);
        this.onSettingsClick = this.onSettingsClick.bind(this);
        this.onToggleChatClick = this.onToggleChatClick.bind(this);
        this.onDownloadLogClick = this.onDownloadLogClick.bind(this);
        this.onTimerExpired = this.onTimerExpired.bind(this);
        this.sendMessage = this.sendMessage.bind(this);

        this.boundActions = bindActionCreators(actions, props.dispatch);

        this.groupCardsInPlayForMe = makeCardsInPlayGrouper();
        this.groupCardsInPlayForOther = makeCardsInPlayGrouper();

        this.state = {
            cardToZoom: undefined,
            showChat: true,
            showChatAlert: false,
            showConflictDeck: false,
            showDynastyDeck: false,
            spectating: true,
            showActionWindowsMenu: false,
            showCardMenu: {},
            showSettingsModal: false
        };
    }

    componentDidMount() {
        this.updateContextMenu(this.props);
    }

    componentDidUpdate(prevProps: GameBoardProps) {
        if(prevProps.currentGame !== this.props.currentGame || prevProps.username !== this.props.username) {
            this.updateContextMenu(this.props);
        }
        this.notifyOfNewMessages(this.props, prevProps);
    }

    private draggableRef: RefObject<any>;
    private opponentDraggableRef: RefObject<any>;
    private boundActions: Record<string, ActionFn>;
    private groupCardsInPlayForMe: ReturnType<typeof makeCardsInPlayGrouper>;
    private groupCardsInPlayForOther: ReturnType<typeof makeCardsInPlayGrouper>;

    notifyOfNewMessages(currentProps: GameBoardProps, prevProps: GameBoardProps) {
        if(currentProps.currentGame && !this.state.showChat) {
            const prevLength = this.getMessagesFromPlayers(prevProps.currentGame?.messages || []).length;
            const currentLength = this.getMessagesFromPlayers(currentProps.currentGame.messages || []).length;

            if(prevLength < currentLength) {
                this.setState({ showChatAlert: true });
            }
        }
    }

    getMessagesFromPlayers(messages: GameMessage[]) {
        return messages.filter(
            (message: GameMessage) => (message.message instanceof Array) && message.message.some((fragment: MessageFragment) => !!fragment.name)
        );
    }

    updateContextMenu(props: GameBoardProps) {
        if(!props.currentGame) {
            return;
        }

        let thisPlayer = props.currentGame.players[props.username];

        if(thisPlayer) {
            this.setState({ spectating: false });
        } else {
            this.setState({ spectating: true });
        }

        if(thisPlayer && thisPlayer.selectCard) {
            document.body.classList.add("select-cursor");
        } else {
            document.body.classList.remove("select-cursor");
        }

        type ContextMenuOption =
            | { text: string; onClick: (...args: any[]) => any }
            | { text: string; popup: React.ReactNode };
        let menuOptions: ContextMenuOption[] = [
            { text: "Leave Game", onClick: this.onLeaveClick }
        ];

        if(props.currentGame && props.currentGame.started) {
            if(Object.values<any>(props.currentGame.players).find(p => {
                return p.name === props.username;
            })) {
                menuOptions.unshift({ text: "Concede", onClick: this.onConcedeClick });
            }

            let spectators = props.currentGame.spectators.map((spectator: Spectator) => {
                return <li key={ spectator.name }>{ spectator.name }</li>;
            });

            let spectatorPopup = (
                <ul className="spectators-popup absolute-panel">
                    { spectators }
                </ul>
            );

            menuOptions.unshift({ text: `Spectators: ${props.currentGame.spectators.length}`, popup: spectatorPopup });

            this.setContextMenu(menuOptions);
        } else {
            this.setContextMenu([]);
        }
    }

    setContextMenu(menu: any[]) {
        if(this.props.setContextMenu) {
            this.props.setContextMenu(menu);
        }
    }

    onConcedeClick() {
        this.props.sendGameMessage("concede");
    }

    isGameActive() {
        if(!this.props.currentGame) {
            return false;
        }

        if(this.props.currentGame.winner) {
            return false;
        }

        let thisPlayer = this.props.currentGame.players[this.props.username];
        if(!thisPlayer) {
            thisPlayer = Object.values(this.props.currentGame.players).sort((a, b) => a.name.localeCompare(b.name))[0];
        }

        let otherPlayer = Object.values(this.props.currentGame.players).find(player => {
            return player.name !== thisPlayer.name;
        });

        if(!otherPlayer) {
            return false;
        }

        if(otherPlayer.disconnected || otherPlayer.left) {
            return false;
        }

        return true;
    }

    onLeaveClick() {
        if(!this.state.spectating && this.isGameActive()) {
            if(window.confirm("Your game is not finished, are you sure you want to leave?")) {
                this.props.sendGameMessage("leavegame");
                this.props.closeGameSocket();
            }

            return;
        }

        this.props.sendGameMessage("leavegame");
        this.props.closeGameSocket();
    }

    onMouseOver(card: MessageFragment) {
        this.props.zoomCard(card);
    }

    onMouseOut() {
        this.props.clearZoom();
    }

    getCardImageUrl(card: CardType) {
        if(!card || !card.id) {
            return "";
        }
        if(card.facedownId) {
            return getCardImageUrl(card.facedownId, card.facedownPackId);
        }
        return getCardImageUrl(card.id, card.packId);
    }

    onCardClick(card: CardType & { controller?: any; isProvince?: boolean }) {
        if(card && card.uuid) {
            this.props.sendGameMessage("cardClicked", card.uuid);
        } else if(card && card.location && card.controller) {
            this.props.sendGameMessage("facedownCardClicked", card.location, card.controller.name, card.isProvince);
        }
    }

    onRingClick(ring: string) {
        this.props.sendGameMessage("ringClicked", ring);
    }

    onConflictClick() {
        this.props.sendGameMessage("showConflictDeck");

        this.setState({ showConflictDeck: !this.state.showConflictDeck });
    }

    onDynastyClick() {
        this.props.sendGameMessage("showDynastyDeck");

        this.setState({ showDynastyDeck: !this.state.showDynastyDeck });
    }

    sendMessage(message: string) {
        if(message === "") {
            return;
        }

        this.props.sendGameMessage("chat", message);
    }

    onConflictShuffleClick() {
        this.props.sendGameMessage("shuffleConflictDeck");
    }

    onDynastyShuffleClick() {
        this.props.sendGameMessage("shuffleDynastyDeck");
    }

    onDragDrop(card: CardType, source: string, target: string) {
        this.props.sendGameMessage("drop", card.uuid, source, target);
    }

    onCardDragStart(event: React.DragEvent, card: CardType, source: string) {
        let dragData = { card: card, source: source };
        event.dataTransfer.setData("Text", JSON.stringify(dragData));
    }

    getCardsInPlay(player: Player & { id?: string }, isMe: boolean) {
        if(!player) {
            return [];
        }

        const conflict = this.props.currentGame.conflict;
        const cardSize = this.props.user.settings.cardSize;
        const disableCardStats = this.props.user.settings.optionSettings.disableCardStats;
        const pendingAnimations = this.props.pendingAnimations;

        const grouper = isMe ? this.groupCardsInPlayForMe : this.groupCardsInPlayForOther;
        const cardsByType = grouper(player.cardPiles.cardsInPlay, isMe);

        const playerIsDefending = (player && conflict.defendingPlayerId && player.id && player.id.includes(conflict.defendingPlayerId));
        const playerDeclaringParticipants = conflict && (!conflict.declarationComplete || (playerIsDefending && !conflict.defendersChosen));

        const onAnimationEnd = (uuid: string) => this.props.dispatch(clearAnimation(uuid));

        return cardsByType.map((cards: CardType[]) => cards.map((card: CardType) => (
            <Card key={ card.uuid } id={ card.uuid } source="play area" card={ card } disableMouseOver={ card.facedown && !card.code }
                onMenuItemClick={ this.onMenuItemClick } onMouseOver={ this.onMouseOver } onMouseOut={ this.onMouseOut }
                showStats={ !disableCardStats } player={ player }
                onClick={ this.onCardClick } onDragDrop={ this.onDragDrop } size={ cardSize } isMe={ isMe } declaring={ playerDeclaringParticipants }
                pendingAnimations={ pendingAnimations } onAnimationEnd={ onAnimationEnd } />
        )));
    }

    onCommand(command: string, arg: any, uuid: string, method: string) {
        let commandArg = arg;

        this.props.sendGameMessage(command, commandArg, uuid, method);
    }

    onDragOver(event: React.DragEvent) {
        event.preventDefault();
    }

    onDragDropEvent(event: React.DragEvent, target: string) {
        event.stopPropagation();
        event.preventDefault();

        let card = event.dataTransfer.getData("Text");
        if(!card) {
            return;
        }

        let dragData = tryParseJSON(card);

        if(!dragData) {
            return;
        }

        this.onDragDrop(dragData.card, dragData.source, target);
    }

    onMenuItemClick(card: CardType, menuItem: MenuItem) {
        this.props.sendGameMessage("menuItemClick", card.uuid, menuItem);
    }

    onRingMenuItemClick(ring: RingType, menuItem: MenuItem) {
        this.props.sendGameMessage("ringMenuItemClick", ring, menuItem);
    }

    onPromptedActionWindowToggle(option: string, value: boolean) {
        this.props.sendGameMessage("togglePromptedActionWindow", option, value);
    }

    onTimerSettingToggle(option: string, value: boolean) {
        this.props.sendGameMessage("toggleTimerSetting", option, value);
    }

    onOptionSettingToggle(option: string, value: any) {
        this.props.sendGameMessage("toggleOptionSetting", option, value);
    }

    onTimerExpired() {
        this.props.sendGameMessage("menuButton", null, "pass");
    }

    onSettingsClick(event: React.MouseEvent) {
        event.preventDefault();
        this.setState({ showSettingsModal: true });
    }

    onToggleChatClick(event: React.MouseEvent) {
        event.preventDefault();
        this.setState({
            showChat: !this.state.showChat,
            showChatAlert: this.state.showChat && this.state.showChatAlert
        });
    }

    onManualModeClick(event: React.MouseEvent) {
        event.preventDefault();
        this.props.sendGameMessage("toggleManualMode");
    }

    onDownloadLogClick() {
        if(this.props.currentGame) {
            downloadGameLog(this.props.currentGame, this.props.username);
        }
    }

    getPrompt(thisPlayer: Player) {
        return (<div className="inset-pane">
            <ActivePlayerPrompt title={ thisPlayer.menuTitle }
                buttons={ thisPlayer.buttons }
                cards={ this.props.cards }
                controls={ thisPlayer.controls }
                promptTitle={ thisPlayer.promptTitle }
                onButtonClick={ this.onCommand }
                onMouseOver={ this.onMouseOver }
                onMouseOut={ this.onMouseOut }
                user={ this.props.user }
                onTimerExpired={ this.onTimerExpired }
                phase={ thisPlayer.phase } />
        </div>);
    }

    getPlayerHand(thisPlayer: Player) {
        let defaultPosition = {
            x: (window.innerWidth / 2) - 240,
            y: (window.innerHeight / 2)
        };

        var handBounds = {
            left: 0,
            right: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - 490,
            top: 0,
            bottom: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - 160
        };

        if(!this.state.spectating) {
            return (<Draggable handle=".grip"
                nodeRef={ this.draggableRef }
                bounds= { handBounds }
                defaultPosition={ defaultPosition } >
                <div ref={ this.draggableRef } className="player-home-row-container">
                    <PlayerHand
                        cards={ thisPlayer.cardPiles.hand }
                        isMe={ !this.state.spectating }
                        onCardClick={ this.onCardClick }
                        onDragDrop={ this.onDragDrop }
                        onMouseOut={ this.onMouseOut }
                        onMouseOver={ this.onMouseOver }
                        cardSize={ this.props.user.settings.cardSize }
                        pendingAnimations={ this.props.pendingAnimations }
                        playerName={ thisPlayer.name }
                        onAnimationEnd={ (id: string) => this.props.dispatch(clearAnimation(id)) } />
                </div>
            </Draggable>);
        }
    }

    getOpponentHand(otherPlayer?: Player) {
        if(!otherPlayer || !otherPlayer.cardPiles.hand) {
            return null;
        }

        // Only show opponent hand if it has revealed cards (replay with hidden info)
        const hasRevealedCards = otherPlayer.cardPiles.hand.some((c: CardType) => !c.facedown && c.id);
        if(!hasRevealedCards) {
            return null;
        }

        let defaultPosition = {
            x: (window.innerWidth / 2) - 240,
            y: 50
        };

        var handBounds = {
            left: 0,
            right: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - 490,
            top: 0,
            bottom: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - 160
        };

        return (<Draggable handle=".grip"
            nodeRef={ this.opponentDraggableRef }
            bounds={ handBounds }
            defaultPosition={ defaultPosition } >
            <div ref={ this.opponentDraggableRef } className="player-home-row-container opponent-hand-container">
                <PlayerHand
                    cards={ otherPlayer.cardPiles.hand }
                    isMe
                    onCardClick={ this.onCardClick }
                    onDragDrop={ this.onDragDrop }
                    onMouseOut={ this.onMouseOut }
                    onMouseOver={ this.onMouseOver }
                    cardSize={ this.props.user.settings.cardSize }
                    pendingAnimations={ this.props.pendingAnimations }
                    playerName={ otherPlayer.name }
                    onAnimationEnd={ (id: string) => this.props.dispatch(clearAnimation(id)) } />
            </div>
        </Draggable>);
    }

    render() {
        if(!this.props.currentGame) {
            return <div>Waiting for server...</div>;
        }

        let manualMode = this.props.currentGame.manualMode;

        let thisPlayer = this.props.currentGame.players[this.props.username];
        if(!thisPlayer) {
            thisPlayer = Object.values(this.props.currentGame.players).sort((a, b) => a.name.localeCompare(b.name))[0];
        }

        if(!thisPlayer) {
            return <div>Waiting for game to have players or close...</div>;
        }

        let otherPlayer = Object.values(this.props.currentGame.players).find(player => {
            return player.name !== thisPlayer.name;
        });

        let thisPlayerCards: React.ReactNode[] = [];
        let index = 0;
        let thisCardsInPlay = this.getCardsInPlay(thisPlayer, true);
        thisCardsInPlay.forEach((cards: React.ReactNode) => {
            thisPlayerCards.push(<div className={ `card-row our-side player-home${thisPlayer && thisPlayer.imperialFavor ? " favor" : ""}` } key={ `this-loc${index++}` }>{ cards }</div>);
        });

        let otherPlayerCards: React.ReactNode[] = [];
        if(otherPlayer) {
            this.getCardsInPlay(otherPlayer, false).forEach((cards: React.ReactNode) => {
                otherPlayerCards.push(<div className={ `card-row player-home${otherPlayer.imperialFavor ? " favor" : ""}` } key={ `other-loc${index++}` }>{ cards }</div>);
            });
        }

        // for(let i = thisPlayerCards.length; i < 2; i++) {
        //     thisPlayerCards.push(<div className="card-row player-home" key={ 'this-empty' + i } />);
        // }

        // for(let i = otherPlayerCards.length; i < 2; i++) {
        //     thisPlayerCards.push(<div className="card-row player-home" key={ 'other-empty' + i } />);
        // }

        return (
            <div className="game-board">
                <GameSettingsModal
                    show={ this.state.showSettingsModal }
                    thisPlayer={ thisPlayer }
                    onClose={ () => this.setState({ showSettingsModal: false }) }
                    onPromptedActionWindowToggle={ this.onPromptedActionWindowToggle.bind(this) }
                    onTimerSettingToggle={ this.onTimerSettingToggle.bind(this) }
                    onOptionSettingToggle={ this.onOptionSettingToggle.bind(this) }
                />
                <HonorChangeOverlay
                    animations={ this.props.pendingAnimations || [] }
                    onDismiss={ () => {
                        for(const a of this.props.pendingAnimations || []) {
                            if(a.type === "honor") {
                                this.props.dispatch(clearAnimation(a.playerName));
                            }
                        }
                    } }
                />
                { this.getPrompt(thisPlayer) }
                { this.getPlayerHand(thisPlayer) }
                { this.getOpponentHand(otherPlayer) }
                { /* Disabled: status in sidebar
                    !thisPlayer.optionSettings.showStatusInSidebar &&
                    <div className="player-stats-row">
                        <PlayerStatsRow
                            clockState={ otherPlayer ? otherPlayer.clock : null }
                            stats={ otherPlayer ? otherPlayer.stats : null }
                            user={ otherPlayer ? otherPlayer.user : null }
                            firstPlayer={ otherPlayer && otherPlayer.firstPlayer }
                            otherPlayer
                            handSize={ otherPlayer && otherPlayer.cardPiles.hand ? otherPlayer.cardPiles.hand.length : 0 }
                        />
                    </div>
                */ }
                <div className={ `main-window ${this.props.user.settings.cardSize}` }>
                    <PlayerSidebar
                        thisPlayer={ thisPlayer }
                        otherPlayer={ otherPlayer }
                        cardSize={ this.props.user.settings.cardSize }
                        showRingEffects={ thisPlayer?.optionSettings?.showRingEffects }
                        gameMode={ this.props.currentGame.gameMode }
                        rings={ this.props.currentGame.rings }
                        spectating={ this.state.spectating }
                        manualMode={ this.props.currentGame.manualMode }
                        boundActions={ this.boundActions }
                        onRingClick={ this.onRingClick }
                        onRingMenuItemClick={ this.onRingMenuItemClick }
                    />
                    <div className={ `play-area${this.props.user.settings.cardSize ? ` ${this.props.user.settings.cardSize}` : ""}` }>
                        <OpponentBoardArea
                            otherPlayer={ otherPlayer }
                            otherPlayerCards={ otherPlayerCards }
                            cardSize={ this.props.user.settings.cardSize }
                            gameMode={ this.props.currentGame.gameMode }
                            skirmishMode={ this.props.currentGame.skirmishMode }
                            onCardClick={ this.onCardClick }
                            onMouseOver={ this.onMouseOver }
                            onMouseOut={ this.onMouseOut }
                            onMenuItemClick={ this.onMenuItemClick }
                        />
                        <CenterBar
                            currentGame={ this.props.currentGame }
                            thisPlayer={ thisPlayer }
                            otherPlayer={ otherPlayer }
                            cardSize={ this.props.user.settings.cardSize }
                            showRingEffects={ thisPlayer?.optionSettings?.showRingEffects }
                            onRingClick={ this.onRingClick }
                            onRingMenuItemClick={ this.onRingMenuItemClick }
                            onCardClick={ this.onCardClick }
                            onDragDrop={ this.onDragDrop }
                            onMenuItemClick={ this.onMenuItemClick }
                            onMouseOver={ this.onMouseOver }
                            onMouseOut={ this.onMouseOut }
                        />
                        <MyBoardArea
                            thisPlayer={ thisPlayer }
                            thisPlayerCards={ thisPlayerCards }
                            cardSize={ this.props.user.settings.cardSize }
                            spectating={ this.state.spectating }
                            manualMode={ manualMode }
                            gameMode={ this.props.currentGame.gameMode }
                            skirmishMode={ this.props.currentGame.skirmishMode }
                            showConflictDeck={ this.state.showConflictDeck }
                            showDynastyDeck={ this.state.showDynastyDeck }
                            onCardClick={ this.onCardClick }
                            onMouseOver={ this.onMouseOver }
                            onMouseOut={ this.onMouseOut }
                            onMenuItemClick={ this.onMenuItemClick }
                            onDragDrop={ this.onDragDrop }
                            onConflictClick={ this.onConflictClick }
                            onDynastyClick={ this.onDynastyClick }
                            onConflictShuffleClick={ this.onConflictShuffleClick }
                            onDynastyShuffleClick={ this.onDynastyShuffleClick }
                            onDragOver={ this.onDragOver }
                            onDropToPlayArea={ event => this.onDragDropEvent(event, "play area") }
                        />
                    </div>
                    <div className="right-side">
                        <CardZoom imageUrl={ this.props.cardToZoom ? this.getCardImageUrl(this.props.cardToZoom) : "" }
                            orientation={ this.props.cardToZoom ? this.props.cardToZoom.type === "plot" ? "horizontal" : "vertical" : "vertical" }
                            show={ !!this.props.cardToZoom } cardName={ this.props.cardToZoom ? this.props.cardToZoom.name : null } />
                        <Chat
                            visible={ this.state.showChat }
                            messages={ this.props.currentGame.messages }
                            onMouseOver={ this.onMouseOver }
                            onMouseOut={ this.onMouseOut }
                            sendMessage={ this.sendMessage }
                        />
                        <Controls
                            onSettingsClick={ this.onSettingsClick }
                            onManualModeClick={ this.onManualModeClick }
                            onDownloadLogClick={ this.onDownloadLogClick }
                            onToggleChatClick={ this.onToggleChatClick }
                            showDownloadLog={ !!this.props.currentGame.winner }
                            showChatAlert={ this.state.showChatAlert }
                            manualModeEnabled={ manualMode }
                            showManualMode={ !this.state.spectating }
                        />
                    </div>
                </div>
                { /* Disabled: status in sidebar
                    !thisPlayer.optionSettings.showStatusInSidebar &&
                    <div className="player-stats-row our-side">
                        <PlayerStatsRow
                            { ...this.boundActions }
                            clockState={ thisPlayer.clock }
                            stats={ thisPlayer.stats }
                            showControls={ !this.state.spectating && manualMode }
                            user={ thisPlayer.user }
                            firstPlayer={ thisPlayer.firstPlayer }
                            otherPlayer={ false }
                            spectating={ this.state.spectating }
                            handSize={ thisPlayer.cardPiles.hand ? thisPlayer.cardPiles.hand.length : 0 } />
                    </div>
                */ }
            </div>);
    }
}

function mapStateToProps(state: RootState): GameBoardStateProps {
    return {
        cardToZoom: state.cards.zoomCard,
        cards: state.cards.cards,
        currentGame: state.games.currentGame,
        pendingAnimations: state.games.pendingAnimations,
        user: state.auth.user,
        username: state.auth.username
    };
}

function mapDispatchToProps(dispatch: Dispatch): GameBoardDispatchProps {
    const boundActions = bindActionCreators(actions as unknown as Record<string, ActionFn>, dispatch);
    return { ...(boundActions as Omit<GameBoardDispatchProps, "dispatch">), dispatch };
}

const GameBoard = connect(mapStateToProps, mapDispatchToProps)(InnerGameBoard);

export default GameBoard;
