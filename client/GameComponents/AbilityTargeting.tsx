import React from "react";
import { ArrowRight } from "lucide-react";
import { getCardImageUrl, getCardBackUrl } from "../cardImageUrl";
import type { Card, Ring } from "../types/game";

type TargetingItem = Card | Ring | { type?: string; name?: string; id?: string; element?: string; isDynasty?: boolean; isConflict?: boolean; packId?: string; facedown?: boolean };

interface AbilityTargetingProps {
    onMouseOut?: (card: Card) => void;
    onMouseOver?: (card: Card) => void;
    source: TargetingItem;
    targets?: TargetingItem[];
}

function AbilityTargeting({ onMouseOut, onMouseOver, source, targets }: AbilityTargetingProps) {
    const handleMouseOver = (_event: React.MouseEvent, card: TargetingItem) => {
        if(card && !(card as Card).facedown && onMouseOver) {
            onMouseOver(card as Card);
        }
    };

    const handleMouseOut = (_event: React.MouseEvent, card: TargetingItem) => {
        if(card && onMouseOut) {
            onMouseOut(card as Card);
        }
    };

    const getCardImagePath = (card: TargetingItem) => {
        const c = card as { id?: string; packId?: string; isDynasty?: boolean; isConflict?: boolean };
        if(!c.id) {
            const backFile = `${c.isDynasty ? "dynasty" : c.isConflict ? "conflict" : "province"}cardback.webp`;
            return getCardBackUrl(backFile);
        }
        return getCardImageUrl(c.id, c.packId);
    };

    const renderSimpleCard = (card: TargetingItem) => {
        const c = card as { name?: string };
        return (
            <div
                className="target-card vertical"
                onMouseOut={ (event) => handleMouseOut(event, card) }
                onMouseOver={ (event) => handleMouseOver(event, card) }
            >
                <img
                    className="target-card-image vertical"
                    alt={ c.name }
                    src={ getCardImagePath(card) }
                />
            </div>
        );
    };

    const renderSimpleRing = (ring: TargetingItem) => {
        const r = ring as { element?: string };
        return (
            <div className="ring-prompt">
                <div className="ring no-highlight">
                    <div className={ `ring icon-element-${r.element} large` } />
                </div>
            </div>
        );
    };

    const renderStringChoice = (string: string) => {
        return (
            <div className="target-card vertical">
                { string }
            </div>
        );
    };

    const targetCards = targets?.map((target, index) => {
        const t = target as { type?: string; name?: string };
        if(t.type === "select") {
            return <span key={ index }>{ renderStringChoice(t.name ?? "") }</span>;
        } else if(t.type === "ring") {
            return <span key={ index }>{ renderSimpleRing(target) }</span>;
        }
        return <span key={ index }>{ renderSimpleCard(target) }</span>;
    });

    let sourceElement;
    const s = source as { type?: string; name?: string };
    if(s.type) {
        sourceElement = s.type === "ring" ? renderSimpleRing(source) : renderSimpleCard(source);
    } else {
        sourceElement = renderStringChoice(s.name ?? "");
    }

    return (
        <div className="prompt-control-targeting">
            { sourceElement }
            { targetCards && targetCards.length > 0 ? <span className="targeting-arrow"><ArrowRight size={ 16 } /></span> : null }
            { targetCards && targetCards.length > 0 ? targetCards : null }
        </div>
    );
}

AbilityTargeting.displayName = "AbilityTargeting";

export default AbilityTargeting;
