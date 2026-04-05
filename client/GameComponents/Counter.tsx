
interface CounterProps {
    cancel?: boolean;
    fade?: boolean;
    name: string;
    shortName?: string;
    value: number;
}

function Counter({ cancel, fade, name, shortName, value }: CounterProps) {
    let className = `counter ${name}`;

    if(cancel) {
        className += " cancel";
    }

    if(fade) {
        className += " fade-out";
    }

    return (
        <div key={ name } className={ className }>
            { shortName ? <span>{ shortName }</span> : null }
            <span>{ value }</span>
        </div>
    );
}

Counter.displayName = "Counter";

export default Counter;
