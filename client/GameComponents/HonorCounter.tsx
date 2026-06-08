import { resolveHonorImage } from "../boardCosmetics";
import { usePatronViewerConfig } from "../PatronContext";

interface HonorCounterProps {
    cancel?: boolean;
    fade?: boolean;
    name: string;
    value: number;
}

function HonorCounter({ cancel, fade, name, value }: HonorCounterProps) {
    const honorImage = resolveHonorImage(usePatronViewerConfig());
    let className = `honorcounter ${name}`;

    if(cancel) {
        className += " cancel";
    }

    if(fade) {
        className += " fade-out";
    }

    return (
        <div key={ name } className={ className }>
            <img src={ honorImage } title="Honor" alt="Honor" />
            <div className="honorcountertext">{ value }</div>
        </div>
    );
}

HonorCounter.displayName = "HonorCounter";

export default HonorCounter;
