
import CardPile from "./CardPile";
import type { Card, AdditionalPile } from "../types/game";

export type { AdditionalPile };

interface AdditionalCardPileProps {
    className?: string;
    isMe?: boolean;
    onMouseOut?: (card: Card) => void;
    onMouseOver?: (card: Card) => void;
    pile: AdditionalPile;
    spectating?: boolean;
}

function AdditionalCardPile({ className, isMe, onMouseOut, onMouseOver, pile, spectating }: AdditionalCardPileProps) {
    let topCard: Card = pile.cards[pile.cards.length - 1];
    if(pile.isPrivate) {
        topCard = { facedown: true, bowed: true } as Card;
    } else if(topCard?.facedown) {
        topCard.bowed = true;
    }

    return (
        <CardPile
            className={ className }
            title={ pile.title }
            source="additional"
            cards={ pile.cards }
            topCard={ topCard }
            onMouseOver={ onMouseOver }
            onMouseOut={ onMouseOut }
            popupLocation={ isMe || spectating ? "top" : "bottom" }
            disableMenu={ pile.isPrivate && !(isMe || spectating) }
            orientation="horizontal"
        />
    );
}

AdditionalCardPile.displayName = "AdditionalCardPile";

export default AdditionalCardPile;
