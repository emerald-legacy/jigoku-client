import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const formattedSeconds = (sec) =>
    (sec <= 0 ? '-' : '') +
    Math.floor(Math.abs(sec) / 60) +
    ':' +
    ('0' + (Math.abs(sec) % 60)).slice(-2);

function Clock({
    delayToStartClock: propDelayToStartClock,
    mainTime: propMainTime,
    manuallyPaused: propManuallyPaused,
    mode,
    periods: propPeriods,
    secondsLeft,
    stateId,
    timePeriod: propTimePeriod
}) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [periods, setPeriods] = useState(0);
    const [mainTime, setMainTime] = useState(0);
    const [timePeriod, setTimePeriod] = useState(0);
    const [delayToStartClock, setDelayToStartClock] = useState(0);
    const [manuallyPaused, setManuallyPaused] = useState(false);

    const prevStateIdRef = useRef(null);
    const timerHandleRef = useRef(null);

    useEffect(() => {
        if(secondsLeft === 0 || prevStateIdRef.current === stateId) {
            return;
        }

        if(prevStateIdRef.current !== stateId) {
            prevStateIdRef.current = stateId;
            setTimeLeft(secondsLeft);
            setPeriods(propPeriods);
            setMainTime(propMainTime);
            setTimePeriod(propTimePeriod);
            setManuallyPaused(propManuallyPaused);
            setDelayToStartClock(propDelayToStartClock);

            if(timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
            }

            if(mode !== 'stop' && !propManuallyPaused) {
                timerHandleRef.current = setInterval(() => {
                    setDelayToStartClock((prevDelay) => {
                        if(prevDelay > 0) {
                            return prevDelay - 1;
                        }
                        setTimeLeft((prevTime) => prevTime + (mode === 'up' ? 1 : -1));
                        return prevDelay;
                    });
                }, 1000);
            }
        }

        return () => {
            if(timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
            }
        };
    }, [
        secondsLeft,
        stateId,
        mode,
        propManuallyPaused,
        propDelayToStartClock,
        propPeriods,
        propMainTime,
        propTimePeriod
    ]);

    const getFormattedClock = () => {
        let delaySeconds = '';
        if(typeof delayToStartClock === 'number') {
            delaySeconds = delayToStartClock > 0 ? formattedSeconds(delayToStartClock) : '0:00';
        }
        if(!periods || timeLeft <= 0) {
            if(delaySeconds) {
                return `${formattedSeconds(timeLeft)}(${delaySeconds})`;
            }
            return `${formattedSeconds(timeLeft)}`;
        }
        let stage = '';
        let timeLeftInPeriod = 0;
        if(timeLeft > periods * timePeriod) {
            stage = 'M';
            timeLeftInPeriod = timeLeft - periods * timePeriod;
        } else {
            stage = Math.ceil(timeLeft / timePeriod);
            if(stage === 1) {
                stage = 'SD';
            }
            timeLeftInPeriod =
                timeLeft % timePeriod === 0 ? timePeriod : timeLeft % timePeriod;
        }
        return `${formattedSeconds(timeLeftInPeriod)} (${stage})`;
    };

    let className = 'player-stats-row state clock';
    if(mode !== 'stop') {
        className += ' clock-active';
    }

    return (
        <div className={ className }>
            <span>
                <img src='/img/free-clock-icon-png.png' className='clock-icon' />
            </span>
            { getFormattedClock() }
        </div>
    );
}

Clock.displayName = 'Clock';
Clock.propTypes = {
    delayToStartClock: PropTypes.number,
    mainTime: PropTypes.number,
    manuallyPaused: PropTypes.bool,
    mode: PropTypes.string,
    periods: PropTypes.number,
    secondsLeft: PropTypes.number,
    stateId: PropTypes.number,
    timePeriod: PropTypes.number
};

export default Clock;
