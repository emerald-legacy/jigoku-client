import PropTypes from 'prop-types';

function FateCounter({ cancel, fade, name, value }) {
    let className = 'fatecounter ' + name;

    if(cancel) {
        className += ' cancel';
    }

    if(fade) {
        className += ' fade-out';
    }

    return (
        <div key={ name } className={ className }>
            <img src='/img/Fate.png' title='Fate' alt='Fate' />
            <div className='fatecountertext'>{ value }</div>
        </div>
    );
}

FateCounter.displayName = 'FateCounter';
FateCounter.propTypes = {
    cancel: PropTypes.bool,
    fade: PropTypes.bool,
    name: PropTypes.string.isRequired,
    shortName: PropTypes.string,
    value: PropTypes.number
};

export default FateCounter;
