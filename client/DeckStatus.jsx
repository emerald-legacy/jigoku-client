import { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import StatusPopOver from './StatusPopOver.jsx';
import validateDeck from './deck-validator.js';
import * as actions from './actions';

export function InnerDeckStatus({ className: propsClassName, deck, updateDeckStatus }) {
    const [deckStatus, setDeckStatus] = useState({});
    const validationTimeoutRef = useRef(null);
    const prevDeckRef = useRef(null);

    const getDeckHash = (deckToHash) => {
        if(!deckToHash) {
            return '';
        }

        // Create a simple hash of the deck contents
        const parts = [];
        const arrays = [
            { name: 's', arr: deckToHash.stronghold },
            { name: 'r', arr: deckToHash.role },
            { name: 'p', arr: deckToHash.provinceCards },
            { name: 'd', arr: deckToHash.dynastyCards },
            { name: 'c', arr: deckToHash.conflictCards }
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

        return parts.sort().join('|');
    };

    const hasDeckContentChanged = (oldDeck, newDeck) => {
        // Check if format changed (affects validation rules)
        if(oldDeck.format !== newDeck.format) {
            return true;
        }

        // Compare deck card lists to see if content changed
        const oldHash = getDeckHash(oldDeck);
        const newHash = getDeckHash(newDeck);
        return oldHash !== newHash;
    };

    const getDeckStatusAsync = async (deckToValidate, forceValidate = false) => {
        const targetDeck = deckToValidate || deck;
        // Only use cached status if not forcing validation
        if(targetDeck.status && !forceValidate) {
            setDeckStatus(targetDeck.status);
            return;
        }
        setDeckStatus({
            valid: undefined,
            extendedStatus: ['Querying Validation Server']
        });
        const gameMode =
            targetDeck.format && targetDeck.format.value
                ? targetDeck.format.value
                : 'stronghold';
        const status = await validateDeck(targetDeck, {
            includeExtendedStatus: true,
            gameMode
        });
        setDeckStatus(status);

        // Update Redux store with validation result
        if(updateDeckStatus && targetDeck._id) {
            updateDeckStatus(targetDeck._id, status);
        }
    };

    const clearValidationTimeout = () => {
        if(validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
            validationTimeoutRef.current = null;
        }
    };

    const scheduleValidation = (deckToSchedule) => {
        // Clear any pending validation
        clearValidationTimeout();

        // Schedule validation for 1 second after the last change
        validationTimeoutRef.current = setTimeout(() => {
            getDeckStatusAsync(deckToSchedule, true);
        }, 1000);
    };

    // Handle deck changes (including initial mount when prevDeck is null)
    useEffect(() => {
        if(!deck) {
            return;
        }

        const prevDeck = prevDeckRef.current;

        // If deck ID changed, validate immediately
        if(!prevDeck || prevDeck._id !== deck._id) {
            clearValidationTimeout();
            getDeckStatusAsync(deck);
            prevDeckRef.current = deck;
            return;
        }

        // If deck content changed (same ID but different cards), debounce validation
        if(hasDeckContentChanged(prevDeck, deck)) {
            scheduleValidation(deck);
        }

        prevDeckRef.current = deck;
    }, [deck, clearValidationTimeout, getDeckStatusAsync, hasDeckContentChanged, scheduleValidation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearValidationTimeout();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    let statusName;
    let className = "deck-status";

    if(propsClassName) {
        className += ` ${propsClassName}`;
    }

    if(deckStatus.valid) {
        statusName = 'Valid';
        className += " valid";
    } else if(deckStatus.valid === false) {
        statusName = 'Invalid';
        className += " invalid";
    } else {
        statusName = 'Validating';
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

InnerDeckStatus.displayName = 'DeckStatus';

function mapStateToProps() {
    return {};
}

const DeckStatus = connect(mapStateToProps, actions)(InnerDeckStatus);

export default DeckStatus;
