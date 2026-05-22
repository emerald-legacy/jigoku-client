import React, { useEffect, useRef, useState } from "react";

interface PhaseChangeOverlayProps {
    phase?: string;
}

const PhaseChangeOverlay: React.FC<PhaseChangeOverlayProps> = ({ phase }) => {
    const [displayed, setDisplayed] = useState<{ phase: string; key: number } | null>(null);
    const prevPhaseRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if(!phase) {
            prevPhaseRef.current = phase;
            return;
        }
        if(prevPhaseRef.current !== undefined && prevPhaseRef.current !== phase) {
            setDisplayed({ phase, key: Date.now() });
        }
        prevPhaseRef.current = phase;
    }, [phase]);

    if(!displayed) {
        return null;
    }

    return (
        <div
            key={ displayed.key }
            className="phase-change-overlay"
            onAnimationEnd={ () => setDisplayed(null) }
        >
            <div className="phase-change-card">
                <div className="phase-change-label">{ displayed.phase } phase</div>
            </div>
        </div>
    );
};

PhaseChangeOverlay.displayName = "PhaseChangeOverlay";

export default PhaseChangeOverlay;
