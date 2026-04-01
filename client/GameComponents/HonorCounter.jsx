
function HonorCounter({ cancel, fade, name, value }) {
    let className = `honorcounter ${name}`;

    if(cancel) {
        className += ' cancel';
    }

    if(fade) {
        className += ' fade-out';
    }

    return (
        <div key={ name } className={ className }>
            <img src='/img/Honor.png' title='Honor' alt='Honor' />
            <div className="honorcountertext">{ value }</div>
        </div>
    );
}

HonorCounter.displayName = 'HonorCounter';

export default HonorCounter;
