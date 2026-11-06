import { asset } from "./assetUrl";
import { activateOnKey } from "./keyboardActivate";
import type { Deck, DeckStatus as DeckStatusType } from "./types/deck";

interface DeckRowProps {
    active?: boolean;
    deck: Deck;
    isSelected?: boolean;
    onCheckboxChange?: (id: string | undefined) => void;
    onClick?: () => void;
    showCheckbox?: boolean;
}

function DeckRow({ active, deck, isSelected, onCheckboxChange, onClick, showCheckbox }: DeckRowProps) {
    const getStatusName = (status: DeckStatusType | undefined) => {
        if(!status) {
            return "Validating";
        }
        if(status.valid) {
            return "Valid";
        } else if(status.valid === false) {
            return "Invalid";
        }
        return "Validating";
    };

    const getStatusClass = (status: DeckStatusType | undefined) => {
        if(!status) {
            return "validating";
        }
        if(status.valid) {
            return "valid";
        } else if(status.valid === false) {
            return "invalid";
        }
        return "validating";
    };

    const deckStatus = getStatusName(deck.status);
    const statusClass = getStatusClass(deck.status);

    return (
        // Not a <button>: it holds the selection checkbox. Keyboard users reach and open it like a button.
        <div
            className={ `deck-row${active ? " active" : ""}` }
            key={ deck.name }
            role="button"
            tabIndex={ 0 }
            aria-pressed={ !!active }
            onClick={ onClick }
            onKeyDown={ activateOnKey(() => onClick?.()) }
        >
            { showCheckbox && (
                // A label, so a tap anywhere in the checkbox's cell ticks it instead of selecting the deck
                <label className="deck-row-checkbox" onClick={ (e: React.MouseEvent) => e.stopPropagation() }>
                    <input
                        type="checkbox"
                        aria-label={ `Select ${deck.name}` }
                        checked={ isSelected }
                        onChange={ () => onCheckboxChange?.(deck._id) }
                    />
                </label>
            ) }
            <div className="deck-row-clans">
                <img className="deck-clan-icon" src={ asset(`mons/${deck.faction.value}.png`) } alt={ deck.faction.name } />
                { deck.alliance && deck.alliance.value ? (
                    <>
                        <span className="deck-clan-separator">/</span>
                        <img className="deck-clan-icon" src={ asset(`mons/${deck.alliance.value}.png`) } alt={ deck.alliance.name } />
                    </>
                ) : null }
            </div>
            <span className="deck-row-name">
                { deck.name }
            </span>
            <span className={ `deck-row-status ${statusClass}` }>
                { deckStatus }
            </span>
        </div>
    );
}

DeckRow.displayName = "DeckRow";

export default DeckRow;
