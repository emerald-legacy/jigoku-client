import { useState } from "react";

import Typeahead from "../FormComponents/Typeahead";
import type { TypeaheadOption } from "../FormComponents/Typeahead";
import type { Card } from "../types/game";

interface CardNameLookupProps {
    cards: Record<string, Card>;
    onCardSelected?: (cardName: string | null) => void;
}

function CardNameLookup({ cards, onCardSelected }: CardNameLookupProps) {
    const [cardName, setCardName] = useState<string | null>(null);

    const onCardNameChange = (card: TypeaheadOption[]) => {
        const first = card[0];
        setCardName(typeof first === "string" ? first : null);
    };

    const onDoneClick = () => {
        if(onCardSelected) {
            onCardSelected(cardName);
        }
    };

    const cardOptions = [...new Set(Object.values(cards).map((card: Card) => card.name))];

    return (
        <div>
            <Typeahead name="cardLookup" labelKey="label" options={ cardOptions } dropup onChange={ onCardNameChange } />
            <button
                type="button"
                disabled={ !cardName }
                onClick={ onDoneClick }
                className="btn btn-primary"
            >
                Done
            </button>
        </div>
    );
}

CardNameLookup.displayName = "CardNameLookup";

export default CardNameLookup;
