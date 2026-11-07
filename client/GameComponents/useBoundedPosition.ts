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

export interface BoardSize {
    /** The window */
    width: number;
    height: number;
    /** The whole board, larger than the window when the page scrolls (phones) */
    boardWidth: number;
    boardHeight: number;
}

/** The extent of the board content: the children of `.main-window` except the right side (chat and card zoom), which is placed by this size. */
function readBoardContentSize() {
    let width = 0;
    let height = 0;
    const board = document.querySelector(".game-board .main-window");
    for(const child of Array.from(board?.children ?? [])) {
        if(child instanceof HTMLElement && !child.classList.contains("right-side")) {
            width = Math.max(width, child.offsetLeft + child.scrollWidth);
            height = Math.max(height, child.offsetTop + child.scrollHeight);
        }
    }
    return { width, height };
}

export function readBoardSize(): BoardSize {
    const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const content = readBoardContentSize();
    return {
        width,
        height,
        boardWidth: Math.max(width, content.width),
        boardHeight: Math.max(height, content.height)
    };
}

/**
 * How far the right side (chat, card zoom) must move right to sit at the board's right edge. On a phone the board
 * content is wider than its frame (.main-window), and window.innerWidth can't tell: it may report the content width.
 */
export function readRightSideOffset() {
    const board = document.querySelector(".game-board .main-window");
    return board ? Math.max(0, readBoardContentSize().width - board.clientWidth) : 0;
}

const sameSize = (a: BoardSize, b: BoardSize) =>
    a.width === b.width && a.height === b.height && a.boardWidth === b.boardWidth && a.boardHeight === b.boardHeight;

/**
 * The window and board size, updated when the window is resized or a tablet is rotated. `measure` reads them again;
 * pass it as the Draggable's `onStart`, so a drag can reach every part of a board that grew since the last resize.
 */
export function useBoardSize() {
    const [size, setSize] = useState(readBoardSize);

    const measure = () => {
        const next = readBoardSize();
        setSize(previous => (sameSize(previous, next) ? previous : next));
    };

    useEffect(() => {
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    return { ...size, measure };
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * The position of a react-draggable panel, kept inside `bounds`: it starts at `initial`, follows the user's drags, and
 * moves back inside when the bounds shrink (a smaller window, a rotated tablet). Bounds that don't fit the screen
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
