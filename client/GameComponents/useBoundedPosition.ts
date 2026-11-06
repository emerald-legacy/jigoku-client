import { useEffect, useState } from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";

export interface Point {
    x: number;
    y: number;
}

export interface Bounds {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

function readViewportSize() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

/** The window size, updated when the window is resized or a tablet is rotated. */
export function useViewportSize() {
    const [size, setSize] = useState(readViewportSize);

    useEffect(() => {
        const update = () => setSize(readViewportSize());
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    return size;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * The position of a react-draggable panel, kept inside `bounds`: it starts at `initial`, follows the user's drags, and
 * moves back on screen when the bounds shrink (a smaller window, a rotated tablet). Bounds that don't fit the screen
 * (a panel wider than the window) collapse to their top-left corner instead of turning invalid.
 */
export function useBoundedPosition(initial: () => Point, bounds: Bounds) {
    const [position, setPosition] = useState(initial);

    const safeBounds = {
        left: bounds.left,
        top: bounds.top,
        right: Math.max(bounds.left, bounds.right),
        bottom: Math.max(bounds.top, bounds.bottom)
    };

    return {
        bounds: safeBounds,
        position: {
            x: clamp(position.x, safeBounds.left, safeBounds.right),
            y: clamp(position.y, safeBounds.top, safeBounds.bottom)
        },
        onStop: (_event: DraggableEvent, data: DraggableData) => setPosition({ x: data.x, y: data.y })
    };
}
