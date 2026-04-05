
interface ClockPopupProps {
    clockName?: string;
    mainTime?: number;
    periods?: number;
    timePeriod?: number;
}

function ClockPopup({ clockName, mainTime, periods, timePeriod }: ClockPopupProps) {
    return (
        <div className="clock--popup">
            <div>{ clockName }</div>
            <ul>
                { mainTime ? <li>Main Time (Minutes): { mainTime / 60 }</li> : null }
                { periods ? <li>Number of Byoyomi Periods: { periods }</li> : null }
                { timePeriod ? <li>Byoyomi Time Period (seconds): { timePeriod }</li> : null }
            </ul>
        </div>
    );
}

ClockPopup.displayName = "ClockPopup";

export default ClockPopup;
