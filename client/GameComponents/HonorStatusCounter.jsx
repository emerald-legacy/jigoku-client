import PropTypes from 'prop-types';

function HonorStatusCounter({ cancel, fade, name, honored, dishonored, tainted }) {
    let className = 'honorstatuscounter ' + name;

    if(cancel) {
        className += ' cancel';
    }

    if(fade) {
        className += ' fade-out';
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
            { honored ? <img src='/img/honor-stone.png' title='Honored' alt='Honored' /> : null }
            { dishonored ? <img src='/img/dishonor-stone.png' title='Dishonored' alt='Dishonored' /> : null }
            { totalProps > 1 ? <div className="honorstatusspacer" /> : null }
            { tainted ? <img src='/img/tainted-stone.png' title='Tainted' alt='Tainted' /> : null }
        </div>
    );
}

HonorStatusCounter.displayName = 'HonorStatusCounter';
HonorStatusCounter.propTypes = {
    cancel: PropTypes.bool,
    dishonored: PropTypes.bool,
    fade: PropTypes.bool,
    honored: PropTypes.bool,
    name: PropTypes.string.isRequired,
    shortName: PropTypes.string,
    tainted: PropTypes.bool,
    value: PropTypes.number
};

export default HonorStatusCounter;
