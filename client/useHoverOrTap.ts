import { useEffect, useRef, useState } from "react";

const triggerAttribute = "data-hover-or-tap";

/**
 * Shows something while the mouse is over a trigger, or after a tap on touch screens (hover doesn't exist there).
 * A tap on the same trigger, or anywhere outside the triggers, hides it again; a tap on another trigger switches to it.
 * Touch is detected per interaction (touchstart fires before the emulated mouse events), so hybrid devices work too.
 */
export function useHoverOrTap<Value>() {
    const [shown, setShown] = useState<{ key: string; value: Value } | undefined>(undefined);
    const [openedByTap, setOpenedByTap] = useState(false);
    const touchingRef = useRef(false);

    useEffect(() => {
        if(!openedByTap) {
            return;
        }
        const hideOnOutsideTap = (event: MouseEvent) => {
            if(event.target instanceof Element && event.target.closest(`[${triggerAttribute}]`)) {
                return;
            }
            setShown(undefined);
            setOpenedByTap(false);
        };
        document.addEventListener("click", hideOnOutsideTap);
        return () => document.removeEventListener("click", hideOnOutsideTap);
    }, [openedByTap]);

    const triggerProps = (key: string, value: Value) => ({
        [triggerAttribute]: "",
        onTouchStart: () => {
            touchingRef.current = true;
        },
        onMouseEnter: () => {
            if(!touchingRef.current) {
                setShown({ key, value });
            }
        },
        onMouseLeave: () => {
            if(!touchingRef.current) {
                setShown(undefined);
            }
        },
        onClick: () => {
            if(!touchingRef.current) {
                return;
            }
            touchingRef.current = false;
            const isOpen = shown?.key === key;
            setShown(isOpen ? undefined : { key, value });
            setOpenedByTap(!isOpen);
        }
    });

    return { shown: shown?.value, triggerProps };
}
