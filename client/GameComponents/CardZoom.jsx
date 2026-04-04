import { memo } from "react";

function CardZoom({ cardName, imageUrl, orientation, show }) {
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
