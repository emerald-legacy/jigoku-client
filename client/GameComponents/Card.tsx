import React, { useState, useRef, memo } from "react";
import { X } from "lucide-react";

import CardMenu from "./CardMenu.jsx";
import CardStats from "./CardStats.jsx";
import CardCounters from "./CardCounters.jsx";
import CardPile from "./CardPile.jsx";
import AbilityUsedMarker from "./AbilityUsedMarker.jsx";
import { getCardImageUrl, getCardBackUrl } from "../cardImageUrl.js";

const shortNames = {
    honor: "H",
    stand: "T",
    poison: "O",
    gold: "G",
    valarmorghulis: "V",
    betrayal: "B",
    vengeance: "N"
};

// Native implementation of finding nearest element matching selector
function findNearestElement(element, selector) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const candidates = document.querySelectorAll(selector);
    let nearest = null;
    let minDistance = Infinity;

    candidates.forEach(candidate => {
        if(candidate === element || candidate.contains(element)) {
            return;
        }
        const candidateRect = candidate.getBoundingClientRect();
        const candidateCenterX = candidateRect.left + candidateRect.width / 2;
        const candidateCenterY = candidateRect.top + candidateRect.height / 2;
        const distance = Math.sqrt(
            Math.pow(centerX - candidateCenterX, 2) +
            Math.pow(centerY - candidateCenterY, 2)
        );
        if(distance < minDistance) {
            minDistance = distance;
            nearest = candidate;
        }
    });

    return nearest;
}

function Card(props) {
    const {
        card,
        className,
        declaring,
        disableMouseOver,
        id,
        isMe,
        onClick,
        onAnimationEnd,
        onCloseClick,
        onDragDrop,
        onMenuItemClick,
        onMouseOut,
        onMouseOver,
        orientation = "vertical",
        pendingAnimations,
        player,
        popupLocation,
        showStats,
        size,
        source,
        style,
        title,
        wrapped = true
    } = props;

    const [showPopup, setShowPopup] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const cardRef = useRef(null);

    const handleMouseOver = (cardData) => {
        if(onMouseOver) {
            onMouseOver(cardData);
        }
    };

    const handleMouseOut = () => {
        if(onMouseOut) {
            onMouseOut();
        }
    };

    const onCardDragStart = (event, cardData, sourceArea) => {
        const dragData = { card: cardData, source: sourceArea };
        event.dataTransfer.setData("Text", JSON.stringify(dragData));
    };

    const onTouchMove = (event) => {
        event.preventDefault();
        const touch = event.targetTouches[0];
        event.currentTarget.style.left = `${touch.screenX - 32}px`;
        event.currentTarget.style.top = `${touch.screenY - 42}px`;
        event.currentTarget.style.position = "fixed";
    };

    const getReactComponentFromDOMNode = (dom) => {
        for(const key in dom) {
            if(key.indexOf("__reactInternalInstance$") === 0) {
                const compInternals = dom[key]._currentElement;
                const compWrapper = compInternals._owner;
                const comp = compWrapper._instance;
                return comp;
            }
        }
        return null;
    };

    const onTouchStart = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTouchStart({ left: rect.left, top: rect.top });
    };

    const onTouchEnd = (event) => {
        const target = event.currentTarget;
        const targetRect = target.getBoundingClientRect();
        const nearestPile = findNearestElement(target, ".card-pile, .hand, .player-board");

        if(!nearestPile) {
            return;
        }

        const pileRect = nearestPile.getBoundingClientRect();

        if(touchStart && targetRect.left === touchStart.left && targetRect.top === touchStart.top) {
            return;
        }

        if(targetRect.left + targetRect.width > pileRect.left - 10 && targetRect.left < pileRect.left + pileRect.width + 10) {
            let dropTarget = "";
            const pileClasses = nearestPile.className || "";

            if(pileClasses.includes("hand")) {
                dropTarget = "hand";
            } else if(pileClasses.includes("player-board")) {
                dropTarget = "play area";
            } else {
                const component = getReactComponentFromDOMNode(nearestPile);
                if(component) {
                    dropTarget = component.props.source;
                }
            }

            if(dropTarget && onDragDrop) {
                onDragDrop(card, source, dropTarget);
            }
        }

        if(touchStart) {
            target.style.left = `${touchStart.left}px`;
            target.style.top = `${touchStart.top}px`;
        }
        event.currentTarget.style.position = "initial";
    };

    const handleClick = (event, cardData) => {
        event.preventDefault();
        event.stopPropagation();

        if(card.menu && card.menu.length > 0) {
            setShowMenu(prev => !prev);
            return;
        }

        if(card.showPopup) {
            setShowPopup(prev => !prev);
            return;
        }

        if(onClick) {
            onClick(cardData);
        }
    };

    const handleMenuItemClick = (menuItem) => {
        if(onMenuItemClick) {
            onMenuItemClick(card, menuItem);
            setShowMenu(prev => !prev);
        }
    };

    const getCountersForCard = (cardData) => {
        const counters = {};
        let statusFlag = 1;
        if(cardData.isHonored) {
            statusFlag *= 2;
        }
        if(cardData.isDishonored) {
            statusFlag *= 3;
        }
        if(cardData.isTainted) {
            statusFlag *= 5;
        }

        counters["card-fate"] = cardData.fate ? { count: cardData.fate, fade: cardData.type === "attachment", shortName: "F" } : undefined;
        counters["card-honor"] = cardData.honor ? { count: cardData.honor, fade: cardData.type === "attachment", shortName: "H" } : undefined;
        if(statusFlag > 1) {
            counters["card-status"] = { count: statusFlag, fade: cardData.type === "attachment", shortName: "Hd" };
        } else {
            counters["card-status"] = undefined;
        }

        if(cardData.tokens) {
            Object.entries(cardData.tokens).forEach(([key, token]) => {
                counters[key] = { count: token, fade: cardData.type === "attachment", shortName: shortNames[key] };
            });
        }

        if(cardData.attachments) {
            cardData.attachments.forEach(attachment => {
                Object.assign(counters, getCountersForCard(attachment));
            });
        }

        // Filter out undefined, null, or negative counters
        const filteredCounters = {};
        Object.entries(counters).forEach(([key, counter]) => {
            if(counter != null && !(typeof counter === "number" && counter < 0)) { // eslint-disable-line eqeqeq
                filteredCounters[key] = counter;
            }
        });

        return filteredCounters;
    };

    const getWrapper = () => {
        let wrapperClassName = "";
        if(source === "play area") {
            wrapperClassName += " at-home";
        }
        if(card.inConflict) {
            wrapperClassName += " conflict";
            if(!declaring) {
                wrapperClassName += " activeCombatant";
            }
        }
        if(size !== "normal") {
            wrapperClassName += ` ${size}`;
        }
        if(isMe) {
            wrapperClassName += " is-mine";
        }

        return wrapperClassName;
    };

    const getWrapperStyle = () => {
        let wrapperStyle = {};
        let attachmentOffset = 13;
        let cardHeight = 84;

        const cardPile = player && card && player.cardPiles[card.uuid];

        switch(size) {
            case "large":
                attachmentOffset *= 1.4;
                cardHeight *= 1.4;
                break;
            case "small":
                attachmentOffset *= 0.8;
                cardHeight *= 0.8;
                break;
            case "x-large":
                attachmentOffset *= 2;
                cardHeight *= 2;
                break;
            case "xxl":
                attachmentOffset *= 2.5;
                cardHeight *= 2.5;
                break;
        }

        const attachmentCount = source === "play area" && card.attachments ? card.attachments.length : 0;
        const attachments = card.attachments || [];
        let totalTiers = 0;
        attachments.forEach(attachment => {
            if(attachment.bowed) {
                totalTiers += 1;
            }
        });

        if(attachmentCount > 0) {
            wrapperStyle = { marginLeft: `${4 + attachmentCount * attachmentOffset}px`, minHeight: `${cardHeight + totalTiers * attachmentOffset}px`, marginTop: cardPile ? "25px" : "0px" };
        } else if(source === "play area") {
            wrapperStyle = { marginLeft: "4px", marginRight: "4px", marginTop: cardPile ? "25px" : "0px" };
        }

        return wrapperStyle;
    };

    const getCardPileElement = () => {
        const cardPile = player && card && player.cardPiles[card.uuid];
        if(!cardPile || !cardPile.length) {
            return null;
        }

        return (
            <CardPile
                source="none"
                title={ `${card.name}` }
                className="underneath"
                cards={ cardPile }
                onMouseOver={ onMouseOver }
                onMouseOut={ onMouseOut }
                onCardClick={ onClick }
                popupLocation="top"
                showPopup
                onDragDrop={ onDragDrop }
                topCard={ cardPile[0] }
                hiddenTopCard
                cardCount={ cardPile.length }
                size={ size }
            />
        );
    };

    const getAttachments = () => {
        const provinces = ["province 1", "province 2", "province 3", "province 4", "stronghold province"];
        if(source !== "play area" && !provinces.includes(source)) {
            return null;
        }

        let attachmentOffset = 13;
        let cardHeight = 84;
        let cardLayer = 45;
        switch(size) {
            case "large":
                attachmentOffset *= 1.4;
                cardHeight *= 1.4;
                break;
            case "small":
                attachmentOffset *= 0.8;
                cardHeight *= 0.8;
                break;
            case "x-large":
                attachmentOffset *= 2;
                cardHeight *= 2;
                break;
            case "xxl":
                attachmentOffset *= 2.5;
                cardHeight *= 2.5;
                break;
        }

        if(!card.attachments) {
            return null;
        }

        let index = 1;
        const attachmentElements = card.attachments.map(attachment => {
            const returnedAttachment = (
                <Card
                    key={ attachment.uuid }
                    id={ attachment.uuid }
                    source={ source }
                    card={ attachment }
                    className="attachment"
                    wrapped={ false }
                    style={ { marginLeft: `${-1 * (index * attachmentOffset)}px`, marginTop: `${-1 * cardHeight - attachmentOffset * (attachment.bowed ? 1 : 0)}px`, zIndex: (cardLayer - index) } }
                    onMouseOver={ disableMouseOver ? null : () => handleMouseOver(attachment) }
                    onMouseOut={ disableMouseOver ? null : handleMouseOut }
                    onClick={ onClick }
                    onMenuItemClick={ onMenuItemClick }
                    onDragStart={ ev => onCardDragStart(ev, attachment, source) }
                    size={ size }
                />
            );

            index += 1;
            return returnedAttachment;
        });

        return attachmentElements;
    };

    const renderUnderneathCards = () => {
        const underneathCards = card.childCards;
        if(!underneathCards || underneathCards.length === 0) {
            return null;
        }

        return (
            <CardPile
                source="none"
                title={ "Underneath" }
                className="beside"
                cards={ underneathCards }
                onMouseOver={ onMouseOver }
                onMouseOut={ onMouseOut }
                onCardClick={ onClick }
                popupLocation="top"
                showPopup
                isMe={ isMe }
                onDragDrop={ onDragDrop }
                topCard={ underneathCards[0] }
                hiddenTopCard
                cardCount={ underneathCards.length }
                size={ size }
            />
        );
    };

    const getCardOrder = () => {
        if(!card.order) {
            return null;
        }
        return (<div className="card-order">{ card.order }</div>);
    };

    const shouldShowMenu = () => {
        if(!card.menu || !showMenu) {
            return false;
        }
        return true;
    };

    const isFacedown = () => {
        return card.facedown || !card.id;
    };

    const getCardImagePath = () => {
        return getCardImageUrl(card.id, card.packId);
    };

    const onCloseClickHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setShowPopup(prev => !prev);

        if(onCloseClick) {
            onCloseClick();
        }
    };

    const onPopupCardClick = (cardData) => {
        setShowPopup(false);

        if(onClick) {
            onClick(cardData);
        }
    };

    const onPopupMenuItemClick = () => {
        setShowPopup(false);

        if(onClick) {
            onClick(card);
        }
    };

    const getPopup = () => {
        let cardIndex = 0;

        const cardList = (card.attachments || []).map(attachmentCard => {
            let cardKey = cardIndex++;
            let displayCard = attachmentCard;
            if(!isMe) {
                displayCard = { facedown: true, isDynasty: attachmentCard.isDynasty, isConflict: attachmentCard.isConflict };
            } else {
                cardKey = attachmentCard.uuid;
            }
            return (
                <Card
                    key={ cardKey }
                    card={ displayCard }
                    source={ source }
                    disableMouseOver={ disableMouseOver || !isMe }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    onClick={ () => onPopupCardClick(displayCard) }
                    onDragDrop={ onDragDrop }
                    orientation={ orientation === "bowed" ? "vertical" : orientation }
                    size={ size }
                />
            );
        });

        if(!card.showPopup || !showPopup) {
            return null;
        }

        let popupClass = "panel";
        let arrowClass = "arrow lg";

        if(popupLocation === "top") {
            popupClass += " our-side";
            arrowClass += " down";
        } else {
            arrowClass += " up";
        }

        if(orientation === "horizontal") {
            arrowClass = "arrow lg left";
        }

        let linkIndex = 0;
        const popupMenu = (<div>{ [<a className="btn btn-default" key={ linkIndex++ } onClick={ () => onPopupMenuItemClick() }>Select Card</a>] }</div>);

        return (
            <div className="popup">
                <div className="panel-title" onClick={ event => event.stopPropagation() }>
                    <span className="text-center">{ title }</span>
                    <span className="pull-right">
                        <a className="close-button" onClick={ onCloseClickHandler }><X size={ 16 } /></a>
                    </span>
                </div>
                <div className={ popupClass } onClick={ event => event.stopPropagation() }>
                    { popupMenu }
                    <div className="inner">
                        { cardList }
                    </div>
                    <div className={ arrowClass } />
                </div>
            </div>
        );
    };

    const getCardElement = () => {
        let cardClass = "card";
        let imageClass = "card-image";
        let cardBack = "cardback.png";

        if(!card) {
            return <div />;
        }

        const anim = pendingAnimations?.find(a => "targetUuid" in a && a.targetUuid === card.uuid);
        const animReadies = anim && "effect" in anim && anim.effect === "ready";
        const displayBowed = !animReadies && (orientation === "bowed" || card.bowed);

        if(size !== "normal") {
            cardClass += ` ${size}`;
            imageClass += ` ${size}`;
        }

        cardClass += ` card-type-${card.type}`;

        if(displayBowed) {
            cardClass += " horizontal";
            imageClass += " vertical bowed";
        } else if(card.isBroken) {
            cardClass += " vertical";
            imageClass += " vertical broken";
        } else {
            cardClass += " vertical";
            imageClass += " vertical";
        }

        if(card.unselectable) {
            cardClass += " unselectable";
        }

        if(card.selected) {
            cardClass += " selected";
        } else if(card.selectable) {
            cardClass += " selectable";
        } else if(card.inDanger) {
            cardClass += " in-danger";
        } else if(card.saved) {
            cardClass += " saved";
        } else if(card.inConflict) {
            cardClass += " conflict";
        } else if(card.covert) {
            cardClass += " covert";
        } else if(card.controlled) {
            cardClass += " controlled";
        } else if(card.new) {
            cardClass += " new";
        }

        if(anim) {
            cardClass += ` ring-effect-${anim.type}`;
        }

        if(className) {
            cardClass += ` ${className}`;
        }

        if(card.isConflict || source === "conflict deck") {
            cardBack = "conflictcardback.png";
        } else if(card.isDynasty || source === "dynasty deck") {
            cardBack = "dynastycardback.png";
        } else if(card.isProvince || source === "province deck") {
            cardBack = "provincecardback.png";
        } else {
            cardBack = "cardback.png";
        }

        const cardPile = player && card && player.cardPiles[card.uuid];

        let frameClassName = "card-frame";
        if(cardPile) {
            frameClassName += " card-pile-frame";
        }

        return (
            <div
                className={ frameClassName }
                ref={ cardRef }
                onTouchMove={ ev => onTouchMove(ev) }
                onTouchEnd={ ev => onTouchEnd(ev) }
                onTouchStart={ ev => onTouchStart(ev) }
            >
                { getCardOrder() }
                <div
                    className={ cardClass }
                    style={ wrapped ? {} : style }
                    id={ id }
                    onMouseOver={ disableMouseOver ? null : () => handleMouseOver(card) }
                    onMouseOut={ disableMouseOver ? null : handleMouseOut }
                    onClick={ ev => handleClick(ev, card) }
                    onDragStart={ ev => onCardDragStart(ev, card, source) }
                    onAnimationEnd={ anim && onAnimationEnd ? () => onAnimationEnd(card.uuid) : undefined }
                    draggable
                >
                    <div>
                        <span className="card-name">{ card.name }</span>
                    </div>
                    <div className={ imageClass }>
                        <img className="card-image-src" src={ !isFacedown() && !card.isToken ? getCardImagePath() : getCardBackUrl(cardBack) } />
                        { card.abilityLimits && <AbilityUsedMarker abilityLimits={ card.abilityLimits } isAttachment={ card.type === "attachment" } /> }
                    </div>
                    <CardCounters counters={ getCountersForCard(card) } />
                </div>
                { shouldShowMenu() ? <CardMenu menu={ card.menu } onMenuItemClick={ handleMenuItemClick } /> : null }
                { !shouldShowMenu() && (showStats || card.strengthSummary?.stat) ?
                    <CardStats
                        text={ card.name }
                        militarySkillSummary={ card.militarySkillSummary }
                        politicalSkillSummary={ card.politicalSkillSummary }
                        glorySummary={ card.glorySummary }
                        strengthSummary={ card.strengthSummary }
                    /> : null
                }
                { getPopup() }
            </div>
        );
    };

    if(wrapped) {
        return (
            <div className={ `card-wrapper ${getWrapper()}` } style={ Object.assign({}, style ? style : {}, getWrapperStyle()) }>
                { getCardElement() }
                { getCardPileElement() }
                { getAttachments() }
                { renderUnderneathCards() }
            </div>
        );
    }

    return getCardElement();
}

const MemoCard = memo(Card);
MemoCard.displayName = "Card";

export default MemoCard;
