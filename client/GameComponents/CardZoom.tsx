import { memo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Draggable from "react-draggable";

const BASE_WIDTH = 220;
const BASE_HEIGHT = 307;
const MAX_WIDTH = 330;
const MAX_SCALE = MAX_WIDTH / BASE_WIDTH;

interface CardZoomProps {
    cardName?: string;
    imageUrl?: string;
    show?: boolean;
}

function CardZoom({ cardName, imageUrl, show }: CardZoomProps) {
    const nodeRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const resizeState = useRef<{ startX: number; startScale: number } | null>(null);
    const hasCard = !!show && !!cardName;

    const effScale = Math.min(Math.max(scale, 1), MAX_SCALE);
    const frameWidth = BASE_WIDTH * effScale;
    const frameHeight = BASE_HEIGHT * effScale;

    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    // Origin is the top-right corner (its default fixed spot). Allow dragging left/down across the board.
    // Buffers (40 horizontal, 53 vertical) cover frame padding/border/grip beyond the card image.
    const bounds = {
        left: -(viewportWidth - (frameWidth + 40)),
        top: 0,
        right: 0,
        bottom: viewportHeight - (frameHeight + 53)
    };

    const onResizeStart = (e: ReactPointerEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        resizeState.current = { startX: e.clientX, startScale: effScale };
    };
    const onResizeMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
        const state = resizeState.current;
        if(!state) {
            return;
        }
        const startW = BASE_WIDTH * state.startScale;
        const newW = Math.min(MAX_WIDTH, Math.max(BASE_WIDTH, startW + (state.startX - e.clientX)));
        setScale(newW / BASE_WIDTH);
    };
    const onResizeEnd = (e: ReactPointerEvent<HTMLSpanElement>) => {
        resizeState.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    let frameClass = "card-zoom-frame";
    if(!hasCard) {
        frameClass += " is-empty";
    }

    const zoomedStyle = { width: `${frameWidth}px`, height: `${frameHeight}px` };

    return (
        <Draggable handle=".card-zoom-grip" nodeRef={ nodeRef } bounds={ bounds } defaultPosition={ { x: 0, y: 0 } }>
            <div ref={ nodeRef } className={ frameClass }>
                <div className="card-zoom-grip no-highlight">
                    <span className="card-zoom-grip-dots" />
                    <span className="card-name">{ hasCard ? cardName : "Zoom" }</span>
                </div>
                <div className="card-zoomed no-highlight" style={ zoomedStyle }>
                    { hasCard ? <img src={ imageUrl } alt={ cardName } /> : null }
                </div>
                <span
                    className="card-zoom-resize no-highlight"
                    onPointerDown={ onResizeStart }
                    onPointerMove={ onResizeMove }
                    onPointerUp={ onResizeEnd }
                    onPointerCancel={ onResizeEnd }
                />
            </div>
        </Draggable>
    );
}

CardZoom.displayName = "CardZoom";

export default memo(CardZoom);
