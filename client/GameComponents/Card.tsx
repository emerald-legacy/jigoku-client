import React, { useState, useRef, useEffect, memo } from "react";

import CardMenu from "./CardMenu";
import CardStats from "./CardStats";
import CardCounters from "./CardCounters";
import CardPile from "./CardPile";
import AbilityUsedMarker from "./AbilityUsedMarker";
import { getCardImageUrl, getCardBackUrl } from "../cardImageUrl";
import { useOwnerShowsPromo } from "../PatronContext";
import { buildCardCounters } from "./buildCardCounters";
import { startCardDrag, useCardTouchDrag } from "./cardDrag";
import CardAttachments from "./CardAttachments";
import CardPopup from "./CardPopup";
import type { Card as CardType, MenuItem, Player } from "../types/game";
import type { AnimationEvent, CardAnimationEvent } from "../types/redux";
import { isCardAnimation } from "../types/redux";

const seenEnterPlayAnimations = new Set<string>();

interface CardProps {
    card: CardType | { facedown: boolean; isDynasty?: boolean; isConflict?: boolean };
    className?: string;
    declaring?: boolean;
    disableMouseOver?: boolean;
    id?: string;
    isMe?: boolean;
    onClick?: (card: CardType) => void;
    onAnimationEnd?: (uuid: string) => void;
    onCloseClick?: () => void;
    onDragDrop?: (card: CardType, source: string, target: string) => void;
    onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
    onTouchMove?: (event: React.TouchEvent) => void;
    onMenuItemClick?: (card: CardType, menuItem: MenuItem) => void;
    onMouseOut?: ((card?: CardType) => void) | null;
    onMouseOver?: ((card: CardType) => void) | null;
    orientation?: string;
    pendingAnimations?: AnimationEvent[];
    player?: Player;
    popupLocation?: string;
    showStats?: boolean;
    hideEffectMarkers?: boolean;
    size?: string;
    source?: string;
    style?: React.CSSProperties;
    title?: string;
    wrapped?: boolean;
}

function Card(props: CardProps) {
    const {
        card: cardInput,
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
        hideEffectMarkers,
        size,
        source,
        style,
        title,
        wrapped = true
    } = props;

    const card = cardInput as CardType;

    // Promo is owner-broadcast: resolve owner from card.controller (always present), not the viewer.
    const ownerUsername = typeof card?.controller === "string"
        ? card.controller
        : card?.controller?.name ?? player?.user?.username;
    const showPromo = useOwnerShowsPromo(ownerUsername);

    const [showPopup, setShowPopup] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [justBroken, setJustBroken] = useState(false);
    const prevBrokenRef = useRef<boolean>(!!card?.isBroken);
    const cardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const isBroken = !!card?.isBroken;
        if(!prevBrokenRef.current && isBroken) {
            setJustBroken(true);
            const t = setTimeout(() => setJustBroken(false), 700);
            prevBrokenRef.current = isBroken;
            return () => clearTimeout(t);
        }
        prevBrokenRef.current = isBroken;
    }, [card?.isBroken]);

    const { onTouchStart, onTouchMove, onTouchEnd } = useCardTouchDrag(card, source, onDragDrop);

    const handleMouseOver = (cardData: CardType) => {
        if(onMouseOver) {
            onMouseOver(cardData);
        }
    };

    const handleMouseOut = () => {
        if(onMouseOut) {
            onMouseOut();
        }
    };

    const handleClick = (event: React.MouseEvent, cardData: CardType) => {
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

    const handleMenuItemClick = (menuItem: MenuItem) => {
        if(onMenuItemClick) {
            onMenuItemClick(card, menuItem);
            setShowMenu(prev => !prev);
        }
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
        attachments.forEach((attachment: CardType) => {
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
        return getCardImageUrl(card.id, card.packId, showPromo);
    };

    const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        if(img.dataset.promoFellBack) {
            return;
        }
        img.dataset.promoFellBack = "1";
        img.src = getCardImageUrl(card.id, card.packId);
    };

    const handleCloseClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setShowPopup(prev => !prev);
        if(onCloseClick) {
            onCloseClick();
        }
    };

    const handlePopupCardClick = (cardData: CardType) => {
        setShowPopup(false);
        if(onClick) {
            onClick(cardData);
        }
    };

    const handleSelectCard = () => {
        setShowPopup(false);
        if(onClick) {
            onClick(card);
        }
    };

    const getCardElement = () => {
        let cardClass = "card";
        let imageClass = "card-image";
        let cardBack = "conflictcardback.webp";

        if(!card) {
            return <div />;
        }

        const anim = pendingAnimations?.find((a): a is CardAnimationEvent => isCardAnimation(a) && a.targetUuid === card.uuid);
        const animReadies = anim?.effect === "ready";
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
            if(justBroken) {
                cardClass += " province-just-broken";
            }
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
        }

        if(card.new && card.uuid && !seenEnterPlayAnimations.has(card.uuid)) {
            cardClass += " new";
        }

        if(card.leaving) {
            cardClass += " leaving";
        }

        if(anim) {
            cardClass += ` ring-effect-${anim.type}`;
        }

        if(className) {
            cardClass += ` ${className}`;
        }

        if(card.isConflict || source === "conflict deck") {
            cardBack = "conflictcardback.webp";
        } else if(card.isDynasty || source === "dynasty deck") {
            cardBack = "dynastycardback.webp";
        } else if(card.isProvince || source === "province deck") {
            cardBack = "provincecardback.webp";
        } else {
            cardBack = "conflictcardback.webp";
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
                onTouchMove={ (ev: React.TouchEvent<HTMLDivElement>) => onTouchMove(ev) }
                onTouchEnd={ (ev: React.TouchEvent<HTMLDivElement>) => onTouchEnd(ev) }
                onTouchStart={ (ev: React.TouchEvent<HTMLDivElement>) => onTouchStart(ev) }
            >
                { getCardOrder() }
                <div
                    className={ cardClass }
                    style={ wrapped ? {} : style }
                    id={ id }
                    onMouseOver={ disableMouseOver ? null : () => handleMouseOver(card) }
                    onMouseOut={ disableMouseOver ? null : handleMouseOut }
                    onClick={ (ev: React.MouseEvent) => handleClick(ev, card) }
                    onDragStart={ (ev: React.DragEvent<HTMLElement>) => startCardDrag(ev, card, source) }
                    onAnimationEnd={ (ev: React.AnimationEvent<HTMLDivElement>) => {
                        if(ev.animationName === "card-enter-play" && card.uuid) {
                            seenEnterPlayAnimations.add(card.uuid);
                        }
                        if(anim && onAnimationEnd && ev.animationName.startsWith("ring-")) {
                            onAnimationEnd(card.uuid);
                        }
                    } }
                    draggable
                >
                    <div>
                        <span className="card-name">{ card.name }</span>
                    </div>
                    <div className={ imageClass }>
                        <img className="card-image-src" src={ !isFacedown() ? getCardImagePath() : getCardBackUrl(cardBack) } onError={ showPromo && !isFacedown() ? handleImageError : undefined } />
                        { card.abilityLimits && <AbilityUsedMarker abilityLimits={ card.abilityLimits } isAttachment={ card.type === "attachment" } /> }
                        { !hideEffectMarkers && card.effectMarkers && card.effectMarkers.length > 0 && (
                            <div
                                className="card-effect-corner"
                                title={ card.effectMarkers.map(e => `${e.kind === "delayed" ? "Pending" : "Active"}: ${e.source}`).join("\n") }
                            />
                        ) }
                    </div>
                    <CardCounters counters={ buildCardCounters(card) } />
                </div>
                { shouldShowMenu() ? <CardMenu menu={ card.menu } onMenuItemClick={ handleMenuItemClick } /> : null }
                { !shouldShowMenu() && source !== "province deck" && (showStats || card.strengthSummary?.stat || (card.effectMarkers && card.effectMarkers.length > 0)) ?
                    <CardStats
                        militarySkillSummary={ card.militarySkillSummary }
                        politicalSkillSummary={ card.politicalSkillSummary }
                        glorySummary={ card.glorySummary }
                        strengthSummary={ card.strengthSummary }
                        effectMarkers={ card.effectMarkers }
                    /> : null
                }
                { card.showPopup && showPopup && (
                    <CardPopup
                        attachments={ card.attachments }
                        title={ title }
                        popupLocation={ popupLocation }
                        orientation={ orientation }
                        isMe={ isMe }
                        source={ source }
                        size={ size }
                        disableMouseOver={ disableMouseOver }
                        onCloseClick={ handleCloseClick }
                        onCardClick={ handlePopupCardClick }
                        onSelectCard={ handleSelectCard }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onDragDrop={ onDragDrop }
                    />
                ) }
            </div>
        );
    };

    if(wrapped) {
        return (
            <div className={ `card-wrapper ${getWrapper()}` } style={ Object.assign({}, style ? style : {}, getWrapperStyle()) }>
                { getCardElement() }
                { getCardPileElement() }
                <CardAttachments
                    attachments={ card.attachments }
                    source={ source }
                    size={ size }
                    disableMouseOver={ disableMouseOver }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    onClick={ onClick }
                    onMenuItemClick={ onMenuItemClick }
                />
                { renderUnderneathCards() }
            </div>
        );
    }

    return getCardElement();
}

const MemoCard = memo(Card);
MemoCard.displayName = "Card";

export default MemoCard;
