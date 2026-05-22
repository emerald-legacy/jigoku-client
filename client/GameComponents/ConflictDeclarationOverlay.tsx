import React, { useEffect, useRef, useState } from "react";
import type { ConflictInfo } from "../types/game";

interface ConflictDeclarationOverlayProps {
    conflict?: ConflictInfo;
}

const ConflictDeclarationOverlay: React.FC<ConflictDeclarationOverlayProps> = ({ conflict }) => {
    const [displayed, setDisplayed] = useState<{ type: string; elements: string[]; key: number } | null>(null);
    const wasActiveRef = useRef(false);

    const declarationComplete = !!conflict?.declarationComplete;
    const type = conflict?.type;
    const elements = conflict?.elements;

    useEffect(() => {
        if(!wasActiveRef.current && declarationComplete && type) {
            setDisplayed({ type, elements: elements || [], key: Date.now() });
        }
        wasActiveRef.current = declarationComplete;
    }, [declarationComplete, type, elements]);

    if(!displayed) {
        return null;
    }

    return (
        <div
            key={ displayed.key }
            className="conflict-declaration-overlay"
            onAnimationEnd={ () => setDisplayed(null) }
        >
            <div className={ `conflict-declaration-card ${displayed.type}` }>
                <div className="conflict-declaration-row">
                    <span className={ `conflict-declaration-icon icon-${displayed.type}` }>&nbsp;</span>
                    { displayed.elements.map(el => (
                        <span key={ el } className={ `conflict-declaration-icon icon-element-${el}` }>&nbsp;</span>
                    )) }
                    <span className="conflict-declaration-word">Conflict</span>
                </div>
            </div>
        </div>
    );
};

ConflictDeclarationOverlay.displayName = "ConflictDeclarationOverlay";

export default ConflictDeclarationOverlay;
