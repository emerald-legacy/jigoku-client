
import CardPile from "./CardPile.jsx";

function AdditionalCardPile({ className, isMe, onMouseOut, onMouseOver, pile, spectating }) {
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
