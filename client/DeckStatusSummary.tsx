import { Check, X } from "lucide-react";
import GameModes from "../shared/GameModes";

interface DeckStatusSummaryStatus {
    basicRules?: boolean;
    officialRole?: boolean;
    noUnreleasedCards?: boolean;
    faqVersion?: string;
    faqRestrictedList?: boolean;
    gameMode?: string;
}

interface DeckStatusSummaryProps {
    status: DeckStatusSummaryStatus;
}

function DeckStatusSummary({ status }: DeckStatusSummaryProps) {
    const { basicRules, officialRole, noUnreleasedCards, faqVersion, faqRestrictedList, gameMode } = status;
    let items: { title: string; value?: boolean }[];

    if(gameMode === GameModes.Skirmish) {
        items = [
            { title: "Basic deckbuilding rules", value: basicRules },
            { title: "Official FFG OP role", value: officialRole },
            { title: `FAQ v${faqVersion} restricted/ban list`, value: faqRestrictedList },
            { title: "Only released cards", value: noUnreleasedCards }
        ];
    } else if(gameMode === GameModes.Emerald) {
        items = [
            { title: "Basic deckbuilding rules", value: basicRules },
            { title: "Emerald Legacy restricted/ban list", value: faqRestrictedList },
            { title: "Only released cards", value: noUnreleasedCards }
        ];
    } else if(gameMode === GameModes.Sanctuary) {
        items = [
            { title: "Basic deckbuilding rules", value: basicRules },
            { title: "Only released cards", value: noUnreleasedCards }
        ];
    } else if(gameMode === GameModes.Obsidian) {
        items = [
            { title: "Basic deckbuilding rules", value: basicRules },
            { title: "Obsidian Heresy ban list", value: faqRestrictedList },
            { title: "Only released cards", value: noUnreleasedCards }
        ];
    } else {
        items = [
            { title: "Basic deckbuilding rules", value: basicRules },
            { title: `FAQ v${faqVersion} restricted/ban list`, value: faqRestrictedList },
            { title: "Only released cards", value: noUnreleasedCards }
        ];
    }

    return (
        <ul className="deck-status-summary">
            { items.map((item) => (
                <li className={ item.value ? "valid" : "invalid" } key={ item.title }>
                    { item.value ? <Check size={ 14 } style={ { display: "inline", verticalAlign: "text-bottom" } } /> : <X size={ 14 } style={ { display: "inline", verticalAlign: "text-bottom" } } /> }
                    { ` ${item.title}` }
                </li>
            )) }
        </ul>
    );
}

DeckStatusSummary.displayName = "DeckStatusSummary";

export default DeckStatusSummary;
