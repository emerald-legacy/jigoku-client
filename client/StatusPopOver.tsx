import { useLayoutEffect, useRef } from "react";

import { useHoverOrTap } from "./useHoverOrTap";
import type { ReactNode } from "react";

interface StatusPopOverProps {
    children: ReactNode;
    show?: boolean;
    status?: string;
}

function StatusPopOver({ children, show, status }: StatusPopOverProps) {
    const popover = useHoverOrTap<true>();
    const popoverRef = useRef<HTMLDivElement | null>(null);

    // Centred under the status, but shifted back inside the window when that would cut it off at a screen edge.
    useLayoutEffect(() => {
        const element = popoverRef.current;
        if(!element) {
            return;
        }
        element.style.marginLeft = "0px";
        const margin = 8;
        const rect = element.getBoundingClientRect();
        const shift = Math.max(margin - rect.left, 0) + Math.min(window.innerWidth - margin - rect.right, 0);
        element.style.marginLeft = `${shift}px`;
        const arrow = element.querySelector<HTMLElement>(".arrow");
        if(arrow) {
            arrow.style.marginLeft = `${-shift}px`;
        }
    }, [popover.shown]);

    if(!show) {
        return <span>{ status }</span>;
    }

    return (
        <span
            className="status-popover-container"
            { ...popover.triggerProps("status", true) }
            style={ { position: "relative", cursor: "pointer" } }
        >
            { status }
            { popover.shown && (
                <div
                    ref={ popoverRef }
                    className="popover bottom in"
                    style={ {
                        display: "block",
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 1060,
                        minWidth: "200px",
                        maxWidth: "min(300px, calc(100vw - 16px))"
                    } }
                >
                    <div className="arrow" style={ { left: "50%" } } />
                    <div className="popover-content">{ children }</div>
                </div>
            ) }
        </span>
    );
}

StatusPopOver.displayName = "StatusPopOver";

export default StatusPopOver;
