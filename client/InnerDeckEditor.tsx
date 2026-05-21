import React, { useState, useEffect } from "react";
import axios from "axios";

import Input from "./FormComponents/Input";
import Select, { type SelectOption } from "./FormComponents/Select";
import Typeahead, { type TypeaheadOption } from "./FormComponents/Typeahead";
import TextArea from "./FormComponents/TextArea";
import { preferredPackId } from "./cardImageUrl";

import type { CardWithVersions, CardVersion } from "./cardImageUrl";
import type { Deck, DeckCard, Faction, Format, Pack } from "./types/deck";
import type { Card } from "./types/game";

type DeckCardLike = CardWithVersions & {
    side?: string;
};

interface EmeraldDbDeckResponse {
    name?: string;
    primary_clan?: string;
    secondary_clan?: string;
    format?: string;
    card_pack_ids?: Record<string, string>;
    cards?: Record<string, number>;
}

type EditableDeck = Deck;

function copyDeck(deck: Deck | undefined, clearStatus = false): EditableDeck {
    if(!deck) {
        return { name: "New Deck" };
    }

    return {
        _id: deck._id,
        name: deck.name,
        stronghold: deck.stronghold,
        role: deck.role,
        provinceCards: deck.provinceCards,
        conflictCards: deck.conflictCards,
        dynastyCards: deck.dynastyCards,
        faction: deck.faction,
        format: deck.format,
        alliance: deck.alliance,
        status: clearStatus ? undefined : deck.status
    };
}

export interface InnerDeckEditorProps {
    alliances?: Record<string, Faction>;
    cards?: Record<string, Card>;
    deck?: Deck;
    factions?: Record<string, Faction>;
    formats?: Record<string, Format>;
    loading?: boolean;
    onDeckSave?: (deck: Deck | undefined) => void;
    packs?: Pack[];
    updateDeck: (deck: Deck) => void;
}

export default function InnerDeckEditor({
    alliances,
    cards,
    deck: propDeck,
    factions,
    formats,
    loading,
    onDeckSave,
    packs,
    updateDeck
}: InnerDeckEditorProps) {
    const [cardList, setCardList] = useState("");
    const [deck, setDeck] = useState(copyDeck(propDeck));
    const [numberToAdd, setNumberToAdd] = useState(1);
    const [cardToAdd, setCardToAdd] = useState<Card | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [importUrl, setImportUrl] = useState("");

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if(event.key === "Escape" && showModal) {
                setShowModal(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [showModal]);

    const getCardListEntry = (count: number, card: DeckCardLike | undefined, packId?: string) => {
        if(!card) {
            return "";
        }
        let packName = "";
        if(card.versions && card.versions.length) {
            const packData = packId
                ? card.versions.find((v: CardVersion) => v.pack_id === packId) || card.versions[card.versions.length - 1]
                : card.versions[card.versions.length - 1];
            const pack = packs?.find((p: Pack) => p.id === packData.pack_id);
            if(pack && pack.name) {
                packName = ` (${pack.name})`;
            }
        }
        return `${count} ${card.name}${packName}\n`;
    };

    useEffect(() => {
        let updatedDeck = copyDeck(deck);
        let updatedDefaultFields = false;
        if(propDeck && !propDeck.faction && factions) {
            updatedDeck.faction = factions["crab"];
            updatedDeck.alliance = { name: "", value: "" };
            updatedDefaultFields = true;
        }
        if(propDeck && !propDeck.format && formats) {
            updatedDeck.format = formats["emerald"];
            updatedDefaultFields = true;
        }
        if(updatedDefaultFields) {
            setDeck(updatedDeck);
            updateDeck(updatedDeck);
        }

        let list = "";
        if(propDeck && (propDeck.stronghold || propDeck.role || propDeck.provinceCards ||
            propDeck.conflictCards || propDeck.dynastyCards)) {
            propDeck.stronghold?.forEach((card: DeckCard) => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.role?.forEach((card: DeckCard) => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.conflictCards?.forEach((card: DeckCard) => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.dynastyCards?.forEach((card: DeckCard) => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            propDeck.provinceCards?.forEach((card: DeckCard) => {
                list += getCardListEntry(card.count, card.card, card.pack_id);
            });
            setCardList(list);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const addCard = (card: DeckCardLike, number: number, packId: string | undefined, currentDeck: Deck) => {
        const deckCopy = copyDeck(currentDeck);
        const provinces: DeckCard[] = [...(deckCopy.provinceCards || [])];
        const stronghold: DeckCard[] = [...(deckCopy.stronghold || [])];
        const role: DeckCard[] = [...(deckCopy.role || [])];
        const conflict: DeckCard[] = [...(deckCopy.conflictCards || [])];
        const dynasty: DeckCard[] = [...(deckCopy.dynastyCards || [])];

        let list: DeckCard[];
        if(card.type === "province") {
            list = provinces;
        } else if(card.side === "dynasty") {
            list = dynasty;
        } else if(card.side === "conflict") {
            list = conflict;
        } else if(card.type === "stronghold") {
            list = stronghold;
        } else {
            list = role;
        }

        const existingIdx = list.findIndex((entry: DeckCard) => entry.card.id === card.id && entry.pack_id === packId);
        if(existingIdx >= 0) {
            list[existingIdx] = { ...list[existingIdx], count: list[existingIdx].count + number };
        } else {
            list.push({ count: number, card: card, pack_id: packId });
        }

        deckCopy.stronghold = stronghold;
        deckCopy.role = role;
        deckCopy.provinceCards = provinces;
        deckCopy.conflictCards = conflict;
        deckCopy.dynastyCards = dynasty;

        return deckCopy;
    };

    const handleChange = (field: "name", event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newDeck = copyDeck(deck);
        newDeck[field] = event.target.value;
        setDeck(newDeck);
        updateDeck(newDeck);
    };

    const handleNumberToAddChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNumberToAdd(Number(event.target.value));
    };

    const handleFormatChange = (selectedFormat: SelectOption | undefined) => {
        const newDeck = copyDeck(deck, true);
        newDeck.format = selectedFormat ? { name: selectedFormat.name || "", value: selectedFormat.value || "" } : undefined;
        setDeck(newDeck);
        updateDeck(newDeck);
    };

    const handleFactionChange = (selectedFaction: SelectOption | undefined) => {
        const newDeck = copyDeck(deck, true);
        newDeck.faction = selectedFaction ? { name: selectedFaction.name || "", value: selectedFaction.value || "" } : undefined;
        setDeck(newDeck);
        updateDeck(newDeck);
    };

    const handleAllianceChange = (selectedAlliance: SelectOption | undefined) => {
        const newDeck = copyDeck(deck, true);
        if(!selectedAlliance) {
            newDeck.alliance = { name: "", value: "" };
        } else {
            newDeck.alliance = { name: selectedAlliance.name || "", value: selectedAlliance.value || "" };
        }
        setDeck(newDeck);
        updateDeck(newDeck);
    };

    const handleAddCardChange = (selectedCards: TypeaheadOption[]) => {
        const selected = selectedCards[0];
        if(selected && typeof selected === "object") {
            setCardToAdd(selected as Card);
        } else {
            setCardToAdd(null);
        }
    };

    const handleAddCard = (event: React.MouseEvent) => {
        event.preventDefault();

        if(!cardToAdd || !cardToAdd.name) {
            return;
        }

        const formatValue = deck.format?.value || "";
        const defaultPackId = preferredPackId(cardToAdd as DeckCardLike, formatValue);

        let list = cardList;
        list += getCardListEntry(numberToAdd, cardToAdd as DeckCardLike, defaultPackId);

        const updatedDeck = addCard(cardToAdd as DeckCardLike, Number(numberToAdd), defaultPackId, deck);
        const clearedDeck = copyDeck(updatedDeck, true);

        setCardList(list);
        setDeck(clearedDeck);
        updateDeck(clearedDeck);
    };

    const handleCardListChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        let currentDeck = copyDeck(deck);
        const split = event.target.value.split("\n");

        currentDeck.stronghold = [];
        currentDeck.role = [];
        currentDeck.provinceCards = [];
        currentDeck.conflictCards = [];
        currentDeck.dynastyCards = [];

        split.forEach((line: string) => {
            line = line.trim();
            let index = 2;

            if(isNaN(parseInt(line[0]))) {
                return;
            }

            const num = parseInt(line[0]);
            if(line[1] === "x") {
                index++;
            }

            const packOffset = line.indexOf("(");
            const cardName = line.substr(index, packOffset === -1 ? line.length : packOffset - index - 1);
            const packName = packOffset > -1 ? line.substr(packOffset + 1, line.length - packOffset - 2) : "";

            const pack = packs?.find((p: Pack) =>
                (p.id || "").toLowerCase() === packName.toLowerCase() || p.name.toLowerCase() === packName.toLowerCase()
            );

            const cardsArray: DeckCardLike[] = cards ? (Object.values(cards) as DeckCardLike[]) : [];
            const card = cardsArray.find((c: DeckCardLike) => {
                if(pack && c.versions && c.versions.length) {
                    if(c.name.toLowerCase() === cardName.toLowerCase()) {
                        return c.versions.find((packCard: CardVersion) => packCard.pack_id === pack.id);
                    }
                    return false;
                }
                return c.name.toLowerCase() === cardName.toLowerCase();
            });

            if(card) {
                const packId = pack ? pack.id : preferredPackId(card, deck.format?.value || "");
                currentDeck = addCard(card, num, packId, currentDeck);
            }
        });

        currentDeck = copyDeck(currentDeck, true);
        setCardList(event.target.value);
        setDeck(currentDeck);
        updateDeck(currentDeck);
    };

    const handleSaveClick = (event: React.MouseEvent) => {
        event.preventDefault();
        if(onDeckSave) {
            onDeckSave(propDeck);
        }
    };

    const handleImportDeckClick = () => {
        setShowModal(true);
    };

    const handleModalClick = (event: React.MouseEvent) => {
        if(event.target === event.currentTarget) {
            setShowModal(false);
        }
    };

    const handleImportDeck = async () => {
        setShowModal(false);
        const emeraldUrl = importUrl.replace("/decks", "/api/decklists");

        try {
            const response = await axios.get<EmeraldDbDeckResponse>(emeraldUrl);
            const deckResponse = response.data;

            if(!deckResponse) {
                return;
            }

            let newDeck = copyDeck(deck);
            newDeck.name = deckResponse.name || "Imported Deck";
            newDeck.faction = (factions && deckResponse.primary_clan && factions[deckResponse.primary_clan]) || (factions && factions["crab"]);
            newDeck.alliance = deckResponse.secondary_clan && factions
                ? factions[deckResponse.secondary_clan]
                : { name: "", value: "" };

            let deckFormat = deckResponse.format || "";
            if(deckFormat === "standard") {
                deckFormat = "stronghold";
            }
            newDeck.format = (formats && formats[deckFormat]) || (formats && formats["emerald"]);

            newDeck.stronghold = [];
            newDeck.role = [];
            newDeck.provinceCards = [];
            newDeck.conflictCards = [];
            newDeck.dynastyCards = [];

            const importFormatValue = newDeck.format?.value;
            const cardPackIds: Record<string, string> = deckResponse.card_pack_ids || {};
            let list = "";
            Object.entries<number>(deckResponse.cards || {}).forEach(([id, count]) => {
                const card = cards && (cards[id] as DeckCardLike | undefined);
                if(card) {
                    const packId = cardPackIds[id] || preferredPackId(card, importFormatValue || "");
                    list += getCardListEntry(count, card, packId);

                    let targetList: DeckCard[] | undefined;
                    if(card.type === "province") {
                        targetList = newDeck.provinceCards;
                    } else if(card.side === "dynasty") {
                        targetList = newDeck.dynastyCards;
                    } else if(card.side === "conflict") {
                        targetList = newDeck.conflictCards;
                    } else if(card.type === "stronghold") {
                        targetList = newDeck.stronghold;
                    } else {
                        targetList = newDeck.role;
                    }
                    targetList?.push({ count: count, card: card, pack_id: packId });
                }
            });

            setCardList(list);
            setDeck(newDeck);
            updateDeck(newDeck);
        } catch(error) {
            console.error("Failed to import deck:", error);
        }
    };

    const handleImportKeyPress = (event: React.KeyboardEvent) => {
        if(event.key === "Enter") {
            event.preventDefault();
            handleImportDeck();
        }
    };

    const formatsArray = formats ? Object.values(formats) : [];
    const factionsArray = factions ? Object.values(factions) : [];
    const alliancesArray = alliances ? Object.values(alliances) : [];
    const cardsArray = cards ? Object.values(cards) : [];

    if(!propDeck || loading) {
        return <div>Waiting for deck...</div>;
    }

    const popup = (
        <div
            className={ `modal fade ${showModal ? "in" : ""}` }
            style={ { display: showModal ? "block" : "none" } }
            tabIndex={ -1 }
            role="dialog"
            onClick={ handleModalClick }
        >
            <div className="modal-dialog" role="document">
                <div className="modal-content deck-select-modal">
                    <div className="deck-select-header">
                        <span className="deck-select-title">Import from EmeraldDB</span>
                        <button type="button" className="deck-select-close" aria-label="Close" onClick={ () => setShowModal(false) }>&times;</button>
                    </div>
                    <div className="deck-import-body">
                        <p className="deck-import-hint">Paste the permalink URL from EmeraldDB:</p>
                        <div className="deck-import-row">
                            <input
                                className="form-control"
                                name="importUrl"
                                placeholder="https://www.emeralddb.org/decks/..."
                                type="text"
                                value={ importUrl }
                                onChange={ (e) => setImportUrl(e.target.value) }
                                onKeyPress={ handleImportKeyPress }
                                autoFocus
                            />
                            <button className="btn btn-primary" onClick={ handleImportDeck }>Import</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const backdrop = showModal ? <div className="modal-backdrop fade in" onClick={ () => setShowModal(false) } /> : null;

    return (
        <div>
            { popup }
            { backdrop }
            <span className="btn btn-primary" onClick={ handleImportDeckClick }>Import deck</span>
            <p>Either type the cards manually into the box below, add the cards one by one using the card box and autocomplete or for best results, copy the permalink url from <a href="https://www.emeralddb.org" target="_blank" rel="noreferrer">Emerald DB</a> and paste it into the popup from clicking the &quot;Import Deck&quot; button.</p>
            <form className="form form-horizontal">
                <Input name="deckName" label="Deck Name" labelClass="col-sm-3" fieldClass="col-sm-9" placeholder="Deck Name"
                    type="text" onChange={ (e) => handleChange("name", e) } value={ deck.name } />
                <Select name="format" label="Format" labelClass="col-sm-3" fieldClass="col-sm-9" options={ formatsArray }
                    onChange={ handleFormatChange } value={ deck.format ? deck.format.value : "emerald" } />
                <Select name="faction" label="Clan" labelClass="col-sm-3" fieldClass="col-sm-9" options={ factionsArray }
                    onChange={ handleFactionChange } value={ deck.faction ? deck.faction.value : undefined } />
                <Select name="alliance" label="Alliance" labelClass="col-sm-3" fieldClass="col-sm-9" options={ alliancesArray }
                    onChange={ handleAllianceChange } value={ deck.alliance ? deck.alliance.value : undefined }
                    valueKey="value" nameKey="name" blankOption={ { name: "- Select -", value: "" } } />

                <Typeahead name="card" label="Card" labelClass="col-sm-3" fieldClass="col-sm-4" labelKey="name" options={ cardsArray }
                    onChange={ handleAddCardChange }>
                    <Input name="numcards" type="text" label="Num" labelClass="col-sm-1" fieldClass="col-sm-2"
                        value={ numberToAdd.toString() } onChange={ handleNumberToAddChange }>
                        <div className="col-sm-1">
                            <button className="btn btn-primary add-card-button" onClick={ handleAddCard }>Add</button>
                        </div>
                    </Input>
                </Typeahead>
                <TextArea name="cards" label="Cards" labelClass="col-sm-3" fieldClass="col-sm-9" rows={ 10 } value={ cardList }
                    onChange={ handleCardListChange } />
                <div className="form-group">
                    <div className="col-sm-offset-3 col-sm-8">
                        <button type="submit" className="btn btn-primary" onClick={ handleSaveClick }>Save Deck</button>
                    </div>
                </div>
            </form>
        </div>
    );
}

InnerDeckEditor.displayName = "DeckEditor";
