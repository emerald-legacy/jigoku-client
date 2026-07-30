import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";

import { PLAY_EXIT_MS } from "./PlayAreaCard";

type PlayAreaRowProps = {
    in?: boolean;
    onExited?: (node?: HTMLElement) => void;
    appear?: boolean;
    enter?: boolean;
    exit?: boolean;
    className: string;
    children: React.ReactNode;
};

// One row of the play area, one per card type. It transitions too, so that the last card of a
// type still animates out: TransitionGroup holds the row's final content while it leaves.
export default function PlayAreaRow({ in: inProp, onExited, appear, enter, exit, className, children }: PlayAreaRowProps) {
    const nodeRef = useRef<HTMLDivElement>(null);

    return (
        <CSSTransition
            in={ inProp }
            onExited={ onExited }
            appear={ appear }
            enter={ enter }
            exit={ exit }
            timeout={ PLAY_EXIT_MS }
            classNames="play-row"
            nodeRef={ nodeRef }
        >
            <div ref={ nodeRef } className={ className }>
                { children }
            </div>
        </CSSTransition>
    );
}
