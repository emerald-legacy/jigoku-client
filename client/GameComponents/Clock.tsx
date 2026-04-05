import { useState, useEffect, useRef } from "react";

const formattedSeconds = (sec: number) =>
    `${sec <= 0 ? "-" : ""}${Math.floor(Math.abs(sec) / 60)}:${String(Math.abs(sec) % 60).padStart(2, "0")}`;

interface ClockProps {
    delayToStartClock?: number;
    mainTime?: number;
    manuallyPaused?: boolean;
    mode: string;
    periods?: number;
    secondsLeft: number;
    stateId?: any;
    timePeriod?: number;
}

function Clock({
    delayToStartClock: propDelayToStartClock,
    mainTime: propMainTime,
    manuallyPaused: propManuallyPaused,
    mode,
    periods: propPeriods,
    secondsLeft,
    stateId,
    timePeriod: propTimePeriod
}: ClockProps) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [periods, setPeriods] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [mainTime, setMainTime] = useState(0);
    const [timePeriod, setTimePeriod] = useState(0);
    const [delayToStartClock, setDelayToStartClock] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [manuallyPaused, setManuallyPaused] = useState(false);

    const prevStateIdRef = useRef<any>(null);
    const timerHandleRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if(secondsLeft === 0 || prevStateIdRef.current === stateId) {
            return;
        }

        if(prevStateIdRef.current !== stateId) {
            prevStateIdRef.current = stateId;
            setTimeLeft(secondsLeft);
            setPeriods(propPeriods || 0);
            setMainTime(propMainTime || 0);
            setTimePeriod(propTimePeriod || 0);
            setManuallyPaused(propManuallyPaused || false);
            setDelayToStartClock(propDelayToStartClock || 0);

            if(timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
            }

            if(mode !== "stop" && !propManuallyPaused) {
                timerHandleRef.current = setInterval(() => {
                    setDelayToStartClock((prevDelay) => {
                        if(prevDelay > 0) {
                            return prevDelay - 1;
                        }
                        setTimeLeft((prevTime) => prevTime + (mode === "up" ? 1 : -1));
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
        let delaySeconds = "";
        if(typeof delayToStartClock === "number") {
            delaySeconds = delayToStartClock > 0 ? formattedSeconds(delayToStartClock) : "0:00";
        }
        if(!periods || timeLeft <= 0) {
            if(delaySeconds) {
                return `${formattedSeconds(timeLeft)}(${delaySeconds})`;
            }
            return `${formattedSeconds(timeLeft)}`;
        }
        let stage: string | number = "";
        let timeLeftInPeriod = 0;
        if(timeLeft > periods * timePeriod) {
            stage = "M";
            timeLeftInPeriod = timeLeft - periods * timePeriod;
        } else {
            stage = Math.ceil(timeLeft / timePeriod);
            if(stage === 1) {
                stage = "SD";
            }
            timeLeftInPeriod =
                timeLeft % timePeriod === 0 ? timePeriod : timeLeft % timePeriod;
        }
        return `${formattedSeconds(timeLeftInPeriod)} (${stage})`;
    };

    let className = `player-stats-row state clock${mode !== "stop" ? " clock-active" : ""}`;

    return (
        <div className={ className }>
            <span>
                <img src="/img/free-clock-icon-png.png" className="clock-icon" />
            </span>
            { getFormattedClock() }
        </div>
    );
}

Clock.displayName = "Clock";

export default Clock;
