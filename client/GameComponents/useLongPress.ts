import { useEffect, useRef } from "react";
import type React from "react";

const moveTolerance = 10;

/**
 * Touch long press: holding one finger still for `delay` ms calls `onLongPress`. Moving the finger (a drag or a scroll)
 * cancels it. After a long press the touchend is cancelled, so no click follows and the long press never also acts on
 * the element. The browser's own long-press menu (image callout, context menu) is suppressed while pressing.
 */
export function useLongPress(onLongPress: () => void, delay = 450) {
    const timerRef = useRef<number | undefined>(undefined);
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const firedRef = useRef(false);

    const cancel = () => {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
    };

    useEffect(() => cancel, []);

    return {
        onTouchStart: (event: React.TouchEvent) => {
            cancel();
            firedRef.current = false;
            if(event.touches.length !== 1) {
                return;
            }
            const touch = event.touches[0];
            startRef.current = { x: touch.clientX, y: touch.clientY };
            timerRef.current = window.setTimeout(() => {
                timerRef.current = undefined;
                firedRef.current = true;
                onLongPress();
            }, delay);
        },
        onTouchMove: (event: React.TouchEvent) => {
            const touch = event.touches[0];
            const start = startRef.current;
            if(touch && start && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > moveTolerance) {
                cancel();
            }
        },
        onTouchEnd: (event: React.TouchEvent) => {
            cancel();
            if(firedRef.current) {
                event.preventDefault();
            }
        },
        onTouchCancel: cancel,
        onContextMenu: (event: React.MouseEvent) => {
            if(timerRef.current !== undefined || firedRef.current) {
                event.preventDefault();
            }
        }
    };
}
