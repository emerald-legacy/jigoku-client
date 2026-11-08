import { useState } from "react";

import Typeahead from "../FormComponents/Typeahead";
import type { TypeaheadOption } from "../FormComponents/Typeahead";
import type { Card, CardNameFilter } from "../types/game";

interface CardNameLookupProps {
    cards: Record<string, Card>;
    filter?: CardNameFilter;
    onCardSelected?: (cardName: string | null) => void;
}

function matches(card: Card, filter: CardNameFilter | undefined): boolean {
    return !filter || (
        (!filter.types || filter.types.includes(card.type ?? "")) &&
        (!filter.sides || filter.sides.includes(card.side ?? "")) &&
        (filter.unique === undefined || !!card.is_unique === filter.unique)
    );
}

function CardNameLookup({ cards, filter, onCardSelected }: CardNameLookupProps) {
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

    const cardOptions = [...new Set(Object.values(cards).filter((card: Card) => matches(card, filter)).map((card: Card) => card.name))];

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
