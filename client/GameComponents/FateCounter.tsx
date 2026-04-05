
interface FateCounterProps {
    cancel?: boolean;
    fade?: boolean;
    name: string;
    value: number;
}

function FateCounter({ cancel, fade, name, value }: FateCounterProps) {
    let className = `fatecounter ${name}`;

    if(cancel) {
        className += " cancel";
    }

    if(fade) {
        className += " fade-out";
    }

    return (
        <div key={ name } className={ className }>
            <img src="/img/Fate.png" title="Fate" alt="Fate" />
            <div className="fatecountertext">{ value }</div>
        </div>
    );
}

FateCounter.displayName = "FateCounter";

export default FateCounter;
