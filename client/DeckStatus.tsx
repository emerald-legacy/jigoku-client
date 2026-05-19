import React, { useState, useEffect, useRef, useCallback } from "react";
import { connect } from "react-redux";

import StatusPopOver from "./StatusPopOver";
import validateDeck from "./deck-validator.js";
import * as actions from "./actions";
import type { Deck } from "./types/deck";

function getDeckHash(deckToHash: Deck | null | undefined) {
    if(!deckToHash) {
        return "";
    }

    const parts = [];
    const arrays = [
        { name: "s", arr: deckToHash.stronghold },
        { name: "r", arr: deckToHash.role },
        { name: "p", arr: deckToHash.provinceCards },
        { name: "d", arr: deckToHash.dynastyCards },
        { name: "c", arr: deckToHash.conflictCards }
    ];

    for(const { name, arr } of arrays) {
        if(arr && arr.length > 0) {
            for(const cardEntry of arr) {
                if(cardEntry.card) {
                    parts.push(`${name}:${cardEntry.card.id}:${cardEntry.count}`);
                }
            }
        }
    }

    return parts.sort().join("|");
}

function hasDeckContentChanged(oldDeck: Deck, newDeck: Deck) {
    if(oldDeck.format !== newDeck.format) {
        return true;
    }
    return getDeckHash(oldDeck) !== getDeckHash(newDeck);
}

interface InnerDeckStatusProps {
    className?: string;
    deck?: any;
    updateDeckStatus?: (...args: any[]) => any;
}

export function InnerDeckStatus({ className: propsClassName, deck, updateDeckStatus }: InnerDeckStatusProps) {
    const [deckStatus, setDeckStatus] = useState<{ valid?: boolean; extendedStatus?: string[] }>({});
    const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevDeckRef = useRef<Deck | null>(null);

    const clearValidationTimeout = useCallback(() => {
        if(validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
            validationTimeoutRef.current = null;
        }
    }, []);

    const getDeckStatusAsync = useCallback(async (deckToValidate: Deck | null, forceValidate = false) => {
        const targetDeck = deckToValidate || deck;
        if(targetDeck.status && !forceValidate) {
            setDeckStatus(targetDeck.status);
            return;
        }
        setDeckStatus({
            valid: undefined,
            extendedStatus: ["Querying Validation Server"]
        });
        const gameMode =
            targetDeck.format && targetDeck.format.value
                ? targetDeck.format.value
                : "stronghold";
        const status = await validateDeck(targetDeck, {
            includeExtendedStatus: true,
            gameMode
        });
        setDeckStatus(status);

        if(updateDeckStatus && targetDeck._id) {
            updateDeckStatus(targetDeck._id, status);
        }
    }, [deck, updateDeckStatus]);

    const scheduleValidation = useCallback((deckToSchedule: Deck) => {
        clearValidationTimeout();
        validationTimeoutRef.current = setTimeout(() => {
            getDeckStatusAsync(deckToSchedule, true);
        }, 1000);
    }, [clearValidationTimeout, getDeckStatusAsync]);

    useEffect(() => {
        if(!deck) {
            return;
        }

        const prevDeck = prevDeckRef.current;

        if(!prevDeck || prevDeck._id !== deck._id) {
            clearValidationTimeout();
            getDeckStatusAsync(deck);
            prevDeckRef.current = deck;
            return;
        }

        if(hasDeckContentChanged(prevDeck, deck)) {
            scheduleValidation(deck);
        }

        prevDeckRef.current = deck;
    }, [deck, clearValidationTimeout, getDeckStatusAsync, scheduleValidation]);

    useEffect(() => {
        return () => {
            clearValidationTimeout();
        };
    }, [clearValidationTimeout]);

    let statusName;
    let className = "deck-status";

    if(propsClassName) {
        className += ` ${propsClassName}`;
    }

    if(deckStatus.valid) {
        statusName = "Valid";
        className += " valid";
    } else if(deckStatus.valid === false) {
        statusName = "Invalid";
        className += " invalid";
    } else {
        statusName = "Validating";
        className += " casual-play";
    }

    return (
        <span className={ className }>
            <StatusPopOver
                status={ statusName }
                show={ deckStatus.extendedStatus && deckStatus.extendedStatus.length !== 0 }
            >
                <div>
                    { deckStatus.extendedStatus && deckStatus.extendedStatus.length !== 0 && (
                        <ul className="deck-status-errors">
                            { deckStatus.extendedStatus.map((error, index) => (
                                <li key={ index }>{ error }</li>
                            )) }
                        </ul>
                    ) }
                </div>
            </StatusPopOver>
        </span>
    );
}

InnerDeckStatus.displayName = "DeckStatus";

function mapStateToProps() {
    return {};
}

const DeckStatus: React.ComponentType<{ className?: string; deck?: any }> = connect(mapStateToProps, actions)(InnerDeckStatus);

export default DeckStatus;
