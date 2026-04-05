import { useState } from "react";

import Typeahead from "../FormComponents/Typeahead";

interface CardNameLookupProps {
    cards: Record<string, any>;
    onCardSelected?: (cardName: string | null) => void;
}

function CardNameLookup({ cards, onCardSelected }: CardNameLookupProps) {
    const [cardName, setCardName] = useState<string | null>(null);

    const onCardNameChange = (card: any[]) => {
        setCardName(card[0]);
    };

    const onDoneClick = () => {
        if(onCardSelected) {
            onCardSelected(cardName);
        }
    };

    const cardOptions = [...new Set(Object.values(cards).map((card: any) => card.name))];

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
