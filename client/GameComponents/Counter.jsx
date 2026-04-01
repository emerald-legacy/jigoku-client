
function Counter({ cancel, fade, name, shortName, value }) {
    let className = `counter ${name}`;

    if(cancel) {
        className += ' cancel';
    }

    if(fade) {
        className += ' fade-out';
    }

    return (
        <div key={ name } className={ className }>
            { shortName ? <span>{ shortName }</span> : null }
            <span>{ value }</span>
        </div>
    );
}

Counter.displayName = 'Counter';

export default Counter;
