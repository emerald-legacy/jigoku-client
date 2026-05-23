import React from "react";
import { ChevronRight } from "lucide-react";

interface CollapsedRailProps {
    counts: { lobby: number; playing: number; spectating: number };
    onExpand: () => void;
}

export default function CollapsedRail({ counts, onExpand }: CollapsedRailProps) {
    return (
        <div className="samurai-rail">
            <button
                type="button"
                className="samurai-rail-toggle"
                aria-label="Expand samurai sidebar"
                aria-expanded="false"
                onClick={ onExpand }
            >
                <ChevronRight size={ 14 } />
            </button>
            <ul className="samurai-rail-counts">
                <li className="samurai-rail-count" data-status="lobby">
                    <span className="samurai-glyph" aria-hidden="true">◉</span>
                    <span>{ counts.lobby }</span>
                </li>
                <li className="samurai-rail-count" data-status="playing">
                    <span className="samurai-glyph" aria-hidden="true">⚔</span>
                    <span>{ counts.playing }</span>
                </li>
                <li className="samurai-rail-count" data-status="spectating">
                    <span className="samurai-glyph" aria-hidden="true">◇</span>
                    <span>{ counts.spectating }</span>
                </li>
            </ul>
        </div>
    );
}
