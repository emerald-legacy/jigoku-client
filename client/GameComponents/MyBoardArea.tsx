import React from "react";
import DynastyRow from "./DynastyRow";
import StrongholdRow from "./StrongholdRow";
import CardPile from "./CardPile";
import type { Card as CardType, MenuItem, Player } from "../types/game";
import GameModes from "../GameModes";

interface MyBoardAreaProps {
    thisPlayer: Player;
    thisPlayerCards: React.ReactNode[];
    cardSize: string;
    spectating: boolean;
    manualMode: boolean;
    gameMode?: string;
    skirmishMode?: boolean;
    showConflictDeck: boolean;
    showDynastyDeck: boolean;
    onCardClick: (card: CardType) => void;
    onMouseOver: (card: any) => void;
    onMouseOut: () => void;
    onMenuItemClick: (card: CardType, menuItem: MenuItem) => void;
    onDragDrop: (card: CardType, source: string, target: string) => void;
    onConflictClick: () => void;
    onDynastyClick: () => void;
    onConflictShuffleClick: () => void;
    onDynastyShuffleClick: () => void;
    onDragOver: (event: React.DragEvent) => void;
    onDropToPlayArea: (event: React.DragEvent) => void;
}

export default function MyBoardArea(props: MyBoardAreaProps) {
    const {
        thisPlayer, thisPlayerCards, cardSize, spectating, manualMode, gameMode, skirmishMode,
        showConflictDeck, showDynastyDeck,
        onCardClick, onMouseOver, onMouseOut, onMenuItemClick, onDragDrop,
        onConflictClick, onDynastyClick, onConflictShuffleClick, onDynastyShuffleClick,
        onDragOver, onDropToPlayArea
    } = props;
    const isSkirmish = !!skirmishMode || gameMode === GameModes.Skirmish;
    return (
        <div className={ `player-board our-side${cardSize ? ` ${cardSize}` : ""}` } onDragOver={ onDragOver } onDrop={ onDropToPlayArea }>
            <StrongholdRow
                isMe={ !spectating }
                spectating={ spectating }
                onCardClick={ onCardClick }
                onDragDrop={ onDragDrop }
                onMenuItemClick={ onMenuItemClick }
                onMouseOver={ onMouseOver }
                onMouseOut={ onMouseOut }
                strongholdProvinceCards={ thisPlayer.strongholdProvince }
                role={ thisPlayer.role }
                thisPlayer={ thisPlayer }
                isSkirmish={ isSkirmish }
                cardSize={ cardSize }
            />
            { !thisPlayer.hideProvinceDeck &&
                <div className="province-group our-side no-highlight">
                    <CardPile
                        className="province-deck"
                        title="Province Deck"
                        source="province deck"
                        cards={ thisPlayer.cardPiles.provinceDeck }
                        hiddenTopCard
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onCardClick={ onCardClick }
                        onDragDrop={ onDragDrop }
                        disableMenu={ spectating }
                        closeOnClick
                        size={ cardSize }
                    />
                </div>
            }
            { thisPlayerCards }
            <div className="player-deck-row our-side">
                <DynastyRow
                    isMe={ !spectating }
                    conflictDiscardPile={ thisPlayer.cardPiles.conflictDiscardPile }
                    conflictDeck={ thisPlayer.cardPiles.conflictDeck }
                    conflictDeckTopCard={ thisPlayer.conflictDeckTopCard }
                    dynastyDiscardPile={ thisPlayer.cardPiles.dynastyDiscardPile }
                    dynastyDeck={ thisPlayer.cardPiles.dynastyDeck }
                    dynastyDeckTopCard={ thisPlayer.dynastyDeckTopCard }
                    removedFromGame={ thisPlayer.cardPiles.removedFromGame }
                    onCardClick={ onCardClick }
                    onConflictClick={ onConflictClick }
                    onDynastyClick={ onDynastyClick }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    manualMode={ manualMode }
                    numConflictCards={ thisPlayer.numConflictCards }
                    numDynastyCards={ thisPlayer.numDynastyCards }
                    onConflictShuffleClick={ onConflictShuffleClick }
                    onDynastyShuffleClick={ onDynastyShuffleClick }
                    province1Cards={ thisPlayer.provinces.one }
                    province2Cards={ thisPlayer.provinces.two }
                    province3Cards={ thisPlayer.provinces.three }
                    province4Cards={ thisPlayer.provinces.four }
                    showConflictDeck={ showConflictDeck }
                    showDynastyDeck={ showDynastyDeck }
                    onDragDrop={ onDragDrop }
                    spectating={ spectating }
                    onMenuItemClick={ onMenuItemClick }
                    isSkirmish={ isSkirmish }
                    cardSize={ cardSize }
                />
            </div>
        </div>
    );
}
