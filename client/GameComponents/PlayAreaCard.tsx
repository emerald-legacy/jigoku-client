import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";

import Card from "./Card";

export const PLAY_EXIT_MS = 550;

type TransitionProps = {
    in?: boolean;
    onExited?: (node?: HTMLElement) => void;
    appear?: boolean;
    enter?: boolean;
    exit?: boolean;
};

type PlayAreaCardProps = TransitionProps & React.ComponentProps<typeof Card>;

// A card in the play area, kept on screen by TransitionGroup for the length of its exit
// animation. The transition props are the ones TransitionGroup injects into its children.
export default function PlayAreaCard({ in: inProp, onExited, appear, enter, exit, ...cardProps }: PlayAreaCardProps) {
    const nodeRef = useRef<HTMLDivElement>(null);

    return (
        <CSSTransition
            in={ inProp }
            onExited={ onExited }
            appear={ appear }
            enter={ enter }
            exit={ exit }
            timeout={ PLAY_EXIT_MS }
            classNames="play-card"
            nodeRef={ nodeRef }
        >
            <div ref={ nodeRef } style={ { display: "contents" } }>
                <Card { ...cardProps } />
            </div>
        </CSSTransition>
    );
}
