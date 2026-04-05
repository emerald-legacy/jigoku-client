import { ArrowRight } from "lucide-react";
import { getCardImageUrl, getCardBackUrl } from "../cardImageUrl";

interface AbilityTargetingProps {
    onMouseOut?: (card: any) => void;
    onMouseOver?: (card: any) => void;
    source: any;
    targets?: any[];
}

function AbilityTargeting({ onMouseOut, onMouseOver, source, targets }: AbilityTargetingProps) {
    const handleMouseOver = (event: React.MouseEvent, card: any) => {
        if(card && !card.facedown && onMouseOver) {
            onMouseOver(card);
        }
    };

    const handleMouseOut = (event: React.MouseEvent, card: any) => {
        if(card && onMouseOut) {
            onMouseOut(card);
        }
    };

    const getCardImagePath = (card: any) => {
        if(!card.id) {
            const backFile = `${card.isDynasty ? "dynasty" : card.isConflict ? "conflict" : "province"}cardback.jpg`;
            return getCardBackUrl(backFile);
        }
        return getCardImageUrl(card.id, card.packId);
    };

    const renderSimpleCard = (card: any) => {
        return (
            <div
                className="target-card vertical"
                onMouseOut={ (event) => handleMouseOut(event, card) }
                onMouseOver={ (event) => handleMouseOver(event, card) }
            >
                <img
                    className="target-card-image vertical"
                    alt={ card.name }
                    src={ getCardImagePath(card) }
                />
            </div>
        );
    };

    const renderSimpleRing = (ring: any) => {
        return (
            <div className="ring-prompt">
                <div className="ring no-highlight">
                    <div className={ `ring icon-element-${ring.element} large` } />
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
        if(target.type === "select") {
            return <span key={ index }>{ renderStringChoice(target.name) }</span>;
        } else if(target.type === "ring") {
            return <span key={ index }>{ renderSimpleRing(target) }</span>;
        }
        return <span key={ index }>{ renderSimpleCard(target) }</span>;
    });

    let sourceElement;
    if(source.type) {
        sourceElement = source.type === "ring" ? renderSimpleRing(source) : renderSimpleCard(source);
    } else {
        sourceElement = renderStringChoice(source.name);
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
