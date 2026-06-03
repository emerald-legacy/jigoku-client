import { memo, useRef } from "react";
import Draggable from "react-draggable";

interface CardZoomProps {
    cardName?: string;
    imageUrl?: string;
    orientation?: string;
    show?: boolean;
}

function CardZoom({ cardName, imageUrl, orientation, show }: CardZoomProps) {
    const nodeRef = useRef<HTMLDivElement>(null);
    const hasCard = !!show && !!cardName;
    const horizontal = hasCard && orientation === "horizontal";

    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    // Origin is the top-right corner (its default fixed spot). Allow dragging left/down across the board.
    const bounds = {
        left: -(viewportWidth - 260),
        top: 0,
        right: 0,
        bottom: viewportHeight - 360
    };

    let frameClass = "card-zoom-frame";
    if(horizontal) {
        frameClass += " horizontal";
    }
    if(!hasCard) {
        frameClass += " is-empty";
    }

    return (
        <Draggable handle=".card-zoom-grip" nodeRef={ nodeRef } bounds={ bounds } defaultPosition={ { x: 0, y: 0 } }>
            <div ref={ nodeRef } className={ frameClass }>
                <div className="card-zoom-grip no-highlight">
                    <span className="card-zoom-grip-dots" />
                    <span className="card-name">{ hasCard ? cardName : "Zoom" }</span>
                </div>
                <div className="card-zoomed no-highlight">
                    { hasCard ? <img src={ imageUrl } alt={ cardName } /> : null }
                </div>
            </div>
        </Draggable>
    );
}

CardZoom.displayName = "CardZoom";

export default memo(CardZoom);
