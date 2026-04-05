
import Counter from "./Counter";
import FateCounter from "./FateCounter";
import HonorCounter from "./HonorCounter";
import HonorStatusCounter from "./HonorStatusCounter";

interface CounterData {
    count: number;
    fade?: boolean;
    cancel?: boolean;
    shortName?: string;
}

interface CardCountersProps {
    counters: Record<string, CounterData>;
}

function CardCounters({ counters }: CardCountersProps) {
    const counterKeys = Object.keys(counters);
    if(counterKeys.length === 0) {
        return null;
    }

    let countersClass = "counters ignore-mouse-events";

    const counterDivs = counterKeys.map((key) => {
        const counter = counters[key];
        if(key === "card-fate" || key === "ring-fate") {
            return (
                <FateCounter
                    key={ key }
                    name={ key }
                    value={ counter.count }
                    fade={ counter.fade }
                    cancel={ counter.cancel }
                />
            );
        }

        if(key === "card-honor" || key === "honor") {
            return (
                <HonorCounter
                    key={ key }
                    name={ key }
                    value={ counter.count }
                    fade={ counter.fade }
                    cancel={ counter.cancel }
                />
            );
        }

        if(key === "card-status" && counter.count > 1) {
            return (
                <HonorStatusCounter
                    key={ key }
                    name={ key }
                    honored={ counter.count % 2 === 0 }
                    dishonored={ counter.count % 3 === 0 }
                    tainted={ counter.count % 5 === 0 }
                    fade={ counter.fade }
                    cancel={ counter.cancel }
                />
            );
        }

        return (
            <Counter
                key={ key }
                name={ key }
                value={ counter.count }
                fade={ counter.fade }
                cancel={ counter.cancel }
                shortName={ counter.shortName }
            />
        );
    });

    if(counterKeys.length > 3) {
        countersClass += " many-counters";
    }

    return <div className={ countersClass }>{ counterDivs }</div>;
}

CardCounters.displayName = "CardCounters";

export default CardCounters;
