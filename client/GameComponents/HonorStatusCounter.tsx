
import { resolveStoneImages } from "../patronOptions";
import { usePatronViewerConfig } from "../PatronContext";

interface HonorStatusCounterProps {
    cancel?: boolean;
    fade?: boolean;
    name: string;
    honored?: boolean;
    dishonored?: boolean;
    tainted?: boolean;
}

function HonorStatusCounter({ cancel, fade, name, honored, dishonored, tainted }: HonorStatusCounterProps) {
    const stones = resolveStoneImages(usePatronViewerConfig());
    let className = `honorstatuscounter ${name}`;

    if(cancel) {
        className += " cancel";
    }

    if(fade) {
        className += " fade-out";
    }

    let totalProps = 0;
    if(honored || dishonored) {
        totalProps++;
    }
    if(tainted) {
        totalProps++;
    }

    return (
        <div key={ name } className={ className }>
            { honored ? <img src={ stones.honored } title="Honored" alt="Honored" /> : null }
            { dishonored ? <img src={ stones.dishonored } title="Dishonored" alt="Dishonored" /> : null }
            { totalProps > 1 ? <div className="honorstatusspacer" /> : null }
            { tainted ? <img src="/img/tainted_stone.webp" title="Tainted" alt="Tainted" /> : null }
        </div>
    );
}

HonorStatusCounter.displayName = "HonorStatusCounter";

export default HonorStatusCounter;
