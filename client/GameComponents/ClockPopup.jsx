import PropTypes from 'prop-types';

function ClockPopup({ clockName, mainTime, periods, timePeriod }) {
    return (
        <div className='clock--popup'>
            <div>{clockName}</div>
            <ul>
                {mainTime ? <li>Main Time (Minutes): {mainTime / 60}</li> : null}
                {periods ? <li>Number of Byoyomi Periods: {periods}</li> : null}
                {timePeriod ? <li>Byoyomi Time Period (seconds): {timePeriod}</li> : null}
            </ul>
        </div>
    );
}

ClockPopup.displayName = 'ClockPopup';
ClockPopup.propTypes = {
    clockName: PropTypes.string,
    mainTime: PropTypes.number,
    periods: PropTypes.number,
    timePeriod: PropTypes.number
};

export default ClockPopup;
