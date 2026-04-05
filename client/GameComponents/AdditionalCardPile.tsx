
import CardPile from "./CardPile.jsx";

interface AdditionalCardPileProps {
    className?: string;
    isMe?: boolean;
    onMouseOut?: (card: any) => void;
    onMouseOver?: (card: any) => void;
    pile: any;
    spectating?: boolean;
}

function AdditionalCardPile({ className, isMe, onMouseOut, onMouseOver, pile, spectating }: AdditionalCardPileProps) {
    let topCard = pile.cards[pile.cards.length - 1];
    if(pile.isPrivate) {
        topCard = { facedown: true, bowed: true };
    } else if(topCard.facedown) {
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
