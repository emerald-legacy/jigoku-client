import { createContext } from "react";

/**
 * Whether cards may be dragged. The server only moves dropped cards in manual mode, so the game board turns dragging
 * off in auto mode and for spectators; a touch on a card then scrolls the page like anywhere else.
 */
export const CardDragContext = createContext(true);
