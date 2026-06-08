
import { resolveFateImage } from "../boardCosmetics";
import { usePatronViewerConfig } from "../PatronContext";

interface FateCounterProps {
    cancel?: boolean;
    fade?: boolean;
    name: string;
    value: number;
}

function FateCounter({ cancel, fade, name, value }: FateCounterProps) {
    const fateImage = resolveFateImage(usePatronViewerConfig());
    let className = `fatecounter ${name}`;

    if(cancel) {
        className += " cancel";
    }

    if(fade) {
        className += " fade-out";
    }

    return (
        <div key={ name } className={ className }>
            <img src={ fateImage } title="Fate" alt="Fate" />
            <div className="fatecountertext">{ value }</div>
        </div>
    );
}

FateCounter.displayName = "FateCounter";

export default FateCounter;
