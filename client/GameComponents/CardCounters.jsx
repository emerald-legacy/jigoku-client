import PropTypes from 'prop-types';

import Counter from './Counter.jsx';
import FateCounter from './FateCounter.jsx';
import HonorCounter from './HonorCounter.jsx';
import HonorStatusCounter from './HonorStatusCounter.jsx';

function CardCounters({ counters }) {
    const counterKeys = Object.keys(counters);
    if (counterKeys.length === 0) {
        return null;
    }

    let countersClass = 'counters ignore-mouse-events';

    const counterDivs = counterKeys.map((key) => {
        const counter = counters[key];
        if (key === 'card-fate' || key === 'ring-fate') {
            return (
                <FateCounter
                    key={key}
                    name={key}
                    value={counter.count}
                    fade={counter.fade}
                    cancel={counter.cancel}
                    shortName={counter.shortName}
                />
            );
        }

        if (key === 'card-honor' || key === 'honor') {
            return (
                <HonorCounter
                    key={key}
                    name={key}
                    value={counter.count}
                    fade={counter.fade}
                    cancel={counter.cancel}
                    shortName={counter.shortName}
                />
            );
        }

        if (key === 'card-status' && counter.count > 1) {
            return (
                <HonorStatusCounter
                    key={key}
                    name={key}
                    value={counter.count}
                    honored={counter.count % 2 === 0}
                    dishonored={counter.count % 3 === 0}
                    tainted={counter.count % 5 === 0}
                    fade={counter.fade}
                    cancel={counter.cancel}
                    shortName={counter.shortName}
                />
            );
        }

        return (
            <Counter
                key={key}
                name={key}
                value={counter.count}
                fade={counter.fade}
                cancel={counter.cancel}
                shortName={counter.shortName}
            />
        );
    });

    if (counterKeys.length > 3) {
        countersClass += ' many-counters';
    }

    return <div className={countersClass}>{counterDivs}</div>;
}

CardCounters.displayName = 'CardCounters';
CardCounters.propTypes = {
    counters: PropTypes.object.isRequired
};

export default CardCounters;
