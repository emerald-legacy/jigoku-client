import { useEffect, useState } from "react";

import { useLongPress } from "./useLongPress";

/**
 * "Peek" at hover-only details on a touch screen: a long press opens them (and calls `onPeek`), the next touch anywhere
 * closes them. Meant for elements whose tap already does something (cards, rings), so a tap can't be used to show details.
 */
export function useTouchPeek(onPeek?: () => void) {
    const [peeking, setPeeking] = useState(false);

    useEffect(() => {
        if(!peeking) {
            return;
        }
        const close = () => setPeeking(false);
        document.addEventListener("touchstart", close);
        return () => document.removeEventListener("touchstart", close);
    }, [peeking]);

    const handlers = useLongPress(() => {
        setPeeking(true);
        onPeek?.();
    });

    return { peeking, handlers };
}
