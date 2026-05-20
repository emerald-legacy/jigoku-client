import React from "react";
import DynastyRow from "./DynastyRow";
import StrongholdRow from "./StrongholdRow";
import type { Card as CardType, MenuItem, Player } from "../types/game";
import GameModes from "../GameModes";

interface OpponentBoardAreaProps {
    otherPlayer?: Player;
    otherPlayerCards: React.ReactNode[];
    cardSize: string;
    gameMode?: string;
    skirmishMode?: boolean;
    onCardClick: (card: CardType) => void;
    onMouseOver: (card: any) => void;
    onMouseOut: () => void;
    onMenuItemClick: (card: CardType, menuItem: MenuItem) => void;
}

export default function OpponentBoardArea(props: OpponentBoardAreaProps) {
    const { otherPlayer, otherPlayerCards, cardSize, gameMode, skirmishMode, onCardClick, onMouseOver, onMouseOut } = props;
    const isSkirmish = !!skirmishMode || gameMode === GameModes.Skirmish;
    return (
        <div className={ `player-board their-side${cardSize ? ` ${cardSize}` : ""}` }>
            <div className="player-deck-row">
                <DynastyRow
                    conflictDiscardPile={ otherPlayer ? otherPlayer.cardPiles.conflictDiscardPile : [] }
                    conflictDeck={ otherPlayer ? otherPlayer.cardPiles.conflictDeck : [] }
                    conflictDeckTopCard={ otherPlayer ? otherPlayer.conflictDeckTopCard : null }
                    dynastyDiscardPile={ otherPlayer ? otherPlayer.cardPiles.dynastyDiscardPile : [] }
                    dynastyDeck={ otherPlayer ? otherPlayer.cardPiles.dynastyDeck : [] }
                    dynastyDeckTopCard={ otherPlayer ? otherPlayer.dynastyDeckTopCard : null }
                    removedFromGame={ otherPlayer ? otherPlayer.cardPiles.removedFromGame : [] }
                    numConflictCards={ otherPlayer ? otherPlayer.numConflictCards : 0 }
                    numDynastyCards={ otherPlayer ? otherPlayer.numDynastyCards : 0 }
                    province1Cards={ otherPlayer ? otherPlayer.provinces.one : [] }
                    province2Cards={ otherPlayer ? otherPlayer.provinces.two : [] }
                    province3Cards={ otherPlayer ? otherPlayer.provinces.three : [] }
                    province4Cards={ otherPlayer ? otherPlayer.provinces.four : [] }
                    onCardClick={ onCardClick }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    otherPlayer={ otherPlayer }
                    isSkirmish={ isSkirmish }
                    cardSize={ cardSize }
                />
            </div>
            { otherPlayerCards }
            <StrongholdRow
                onCardClick={ onCardClick }
                onMouseOver={ onMouseOver }
                onMouseOut={ onMouseOut }
                otherPlayer={ otherPlayer }
                strongholdProvinceCards={ otherPlayer ? otherPlayer.strongholdProvince : [] }
                role={ otherPlayer ? otherPlayer.role : null }
                isSkirmish={ isSkirmish }
                cardSize={ cardSize }
            />
        </div>
    );
}
