import { useState, useRef, memo } from "react";
import Draggable from "react-draggable";
import { X } from "lucide-react";

import Card from "./Card.jsx";
import { tryParseJSON } from "../util.js";

function CardPile({
    cardCount,
    cards,
    className: propsClassName,
    closeOnClick,
    disableMenu,
    disableMouseOver,
    hiddenTopCard,
    isMe = true,
    menu,
    onCardClick,
    onCloseClick,
    onDragDrop,
    onMenuItemClick,
    onMouseOut,
    onMouseOver,
    onTouchMove,
    orientation = "vertical",
    popupLocation,
    popupMenu,
    size,
    source,
    title,
    topCard: propsTopCard
}) {
    const [showPopup, setShowPopup] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const draggableRef = useRef(null);

    const onCollectionClick = (event) => {
        event.preventDefault();

        if(disableMenu) {
            return;
        }

        if(menu) {
            setShowMenu(!showMenu);
            return;
        }

        setShowPopup(!showPopup);
    };

    const handleMenuItemClick = (menuItem) => {
        if(menuItem.showPopup) {
            setShowPopup(!showPopup);
        }

        menuItem.handler();
    };

    const handleCloseClick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setShowPopup(!showPopup);

        if(onCloseClick) {
            onCloseClick();
        }
    };

    const onPopupMenuItemClick = (menuItem) => {
        menuItem.handler();
        setShowPopup(!showPopup);
    };

    const onTopCardClick = () => {
        if(menu && !disableMenu) {
            setShowMenu(!showMenu);
            return;
        }

        if(disableMenu) {
            if(onCardClick) {
                onCardClick(topCard);
            }

            return;
        }

        setShowPopup(!showPopup);
    };

    const onDragOver = (event) => {
        event.target.classList.add("highlight-panel");
        event.preventDefault();
    };

    const onDragLeave = (event) => {
        event.target.classList.remove("highlight-panel");
    };

    const handleDragDrop = (event, target) => {
        event.stopPropagation();
        event.preventDefault();

        event.target.classList.remove("highlight-panel");

        const card = event.dataTransfer.getData("Text");

        if(!card) {
            return;
        }

        const dragData = tryParseJSON(card);

        if(!dragData) {
            return;
        }

        if(onDragDrop) {
            onDragDrop(dragData.card, dragData.source, target);
        }
    };

    const handleCardClick = (card) => {
        if(closeOnClick) {
            setShowPopup(false);
        }

        if(onCardClick) {
            onCardClick(card);
        }
    };

    const getPopup = () => {
        let cardIndex = 0;

        const cardList = cards?.map((card) => {
            const cardKey = card.uuid || cardIndex++;
            return (
                <Card
                    key={ cardKey }
                    card={ card }
                    source={ source }
                    disableMouseOver={ disableMouseOver }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    onTouchMove={ onTouchMove }
                    onClick={ () => handleCardClick(card) }
                    onDragDrop={ onDragDrop }
                    orientation={ orientation === "bowed" ? "vertical" : orientation }
                    size={ size }
                />
            );
        });

        if(!showPopup) {
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

        const popupMenuElement = popupMenu ? (
            <div>
                { popupMenu.map((menuItem) => {
                    return (
                        <a
                            className="btn btn-default"
                            key={ linkIndex++ }
                            onClick={ () => onPopupMenuItemClick(menuItem) }
                        >
                            { menuItem.text }
                        </a>
                    );
                }) }
            </div>
        ) : null;

        return (
            <Draggable handle=".grip" cancel=".close-button" nodeRef={ draggableRef }>
                <div ref={ draggableRef } className={ `popup ${isMe ? "" : "opponent"}` }>
                    <div className="grip">
                        <div
                            className="panel-title"
                            onClick={ (event) => event.stopPropagation() }
                        >
                            <span className="text-center">{ title }</span>
                            <span className="pull-right">
                                <a
                                    className="close-button"
                                    onClick={ handleCloseClick }
                                ><X size={ 16 } /></a>
                            </span>
                        </div>
                    </div>
                    <div
                        className={ popupClass }
                        onClick={ (event) => event.stopPropagation() }
                    >
                        { popupMenuElement }
                        <div className="inner">{ cardList }</div>
                        <div className={ arrowClass } />
                    </div>
                </div>
            </Draggable>
        );
    };

    const getMenu = () => {
        let menuIndex = 0;

        const menuElements = menu?.map((item) => {
            return (
                <div key={ (menuIndex++).toString() } onClick={ () => handleMenuItemClick(item) }>
                    { item.text }
                </div>
            );
        });

        return <div className="panel menu">{ menuElements }</div>;
    };

    let className = `card-pile ${propsClassName || ""}`;
    if(size !== "normal") {
        className += ` ${size}`;
    }

    const displayCardCount = cardCount || (cards ? cards.length : 0);
    if(displayCardCount === 0) {
        className += " panel";
    }
    const headerText = title ? `${title} (${displayCardCount})` : "";
    const topCard = propsTopCard || (cards && cards[0]);
    const cardOrientation =
        orientation === "horizontal" && topCard && topCard.facedown
            ? "bowed"
            : orientation;

    const displayTopCard = hiddenTopCard && !propsTopCard ? { facedown: true } : topCard;

    if(orientation === "horizontal" || orientation === "bowed") {
        className += " horizontal";
    } else {
        className += " vertical";
    }

    return (
        <div
            className={ className }
            onDragLeave={ onDragLeave }
            onDragOver={ onDragOver }
            onDrop={ (event) => handleDragDrop(event, source) }
            onClick={ onCollectionClick }
        >
            <div className="panel-header">{ headerText }</div>
            { displayTopCard ? (
                <Card
                    card={ displayTopCard }
                    source={ source }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    disableMouseOver={ hiddenTopCard }
                    onClick={ onTopCardClick }
                    onMenuItemClick={ onMenuItemClick }
                    onDragDrop={ onDragDrop }
                    orientation={ cardOrientation }
                    size={ size }
                />
            ) : (
                <div className="card-placeholder" />
            ) }
            { showMenu ? getMenu() : null }
            { getPopup() }
        </div>
    );
}

CardPile.displayName = "CardPile";

export default memo(CardPile);
