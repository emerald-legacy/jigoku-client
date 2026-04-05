import { memo } from "react";

interface CardZoomProps {
    cardName?: string;
    imageUrl?: string;
    orientation?: string;
    show?: boolean;
}

function CardZoom({ cardName, imageUrl, orientation, show }: CardZoomProps) {
    let zoomClass = "card-large";

    if(orientation === "horizontal") {
        zoomClass += "-horizontal";
    }

    return (
        <div className={ zoomClass }>
            { show && cardName !== undefined ? (
                <div className="card-zoomed shadow no-highlight">
                    <span className="card-name">{ cardName }</span>
                    <img src={ imageUrl } />
                </div>
            ) : null }
        </div>
    );
}

CardZoom.displayName = "CardZoom";

export default memo(CardZoom);
