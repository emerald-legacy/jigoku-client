import Clock from './Clock.jsx';
import ClockPopup from './ClockPopup.jsx';

export function PlayerStatsBox({
    clockState,
    firstPlayer,
    handSize,
    otherPlayer,
    sendGameMessage,
    showControls,
    size,
    stats
}) {
    const sendUpdate = (type, direction) => {
        sendGameMessage('changeStat', type, direction === 'up' ? 1 : -1);
    };

    const getStatValueOrDefault = (stat) => {
        if(!stats) {
            return 0;
        }
        return stats[stat] || 0;
    };

    const getButton = (stat, name, statToSet = stat) => {
        const imageStyle = { backgroundImage: `url(/img/${name}.png)` };

        return (
            <div className="state">
                { showControls && (
                    <button
                        className={ 'btn btn-stat ' + size }
                        onClick={ () => sendUpdate(statToSet, 'down') }
                    >
                        <img src='/img/Minus.png' title='-' alt='-' />
                    </button>
                ) }
                <div className={ 'stat-image ' + size } style={ imageStyle } />
                <div>:</div>
                <div className='stat-value'>{ getStatValueOrDefault(stat) }</div>
                { showControls && (
                    <button
                        className={ 'btn btn-stat ' + size }
                        onClick={ () => sendUpdate(statToSet, 'up') }
                    >
                        <img src='/img/Plus.png' title='+' alt='+' />
                    </button>
                ) }
            </div>
        );
    };

    const handImageStyle = { backgroundImage: 'url(/img/conflictcard.png)' };

    const clock =
        !clockState || clockState.mode === 'off' ? null : (
            <div className="state clock-frame">
                <Clock
                    delayToStartClock={ clockState.delayToStartClock }
                    manuallyPaused={ clockState.manuallyPaused }
                    secondsLeft={ clockState.timeLeft }
                    mode={ clockState.mode }
                    stateId={ clockState.stateId }
                    periods={ clockState.periods }
                    mainTime={ clockState.mainTime }
                    timePeriod={ clockState.timePeriod }
                />
                <ClockPopup
                    mainTime={ clockState.mainTime }
                    periods={ clockState.periods }
                    timePeriod={ clockState.timePeriod }
                    clockName={ clockState.name }
                />
            </div>
        );

    return (
        <div className={ `player-stats${otherPlayer ? "" : " our-side"}` }>
            <div className="stats-row">
                <div className="state first-player-state">
                    <img
                        className={ `first-player-indicator${firstPlayer ? "" : " hidden"}` }
                        src='/img/first-player.png'
                        title='First Player'
                    />
                </div>
            </div>
            <div className="stats-row">{ clock }</div>
            <div className="stats-row">
                <div className="state">
                    <div className="conflicts-remaining">
                        Conflicts: { getStatValueOrDefault('conflictsRemaining') }
                        <div>
                            { getStatValueOrDefault('politicalRemaining') > 0 ? (
                                <span className="icon-political" />
                            ) : null }
                            { getStatValueOrDefault('politicalRemaining') > 1 ? (
                                <span className="icon-political" />
                            ) : null }
                            { getStatValueOrDefault('militaryRemaining') > 0 ? (
                                <span className="icon-military" />
                            ) : null }
                            { getStatValueOrDefault('militaryRemaining') > 1 ? (
                                <span className="icon-military" />
                            ) : null }
                        </div>
                    </div>
                </div>
            </div>
            <div className="player-stats__resources">
                <div className="stats-row">
                    <div className="state">
                        <div className={ `stat-image ${size}` } style={ handImageStyle } />
                        <div>:</div>
                        <div className="stat-value">{ handSize }</div>
                    </div>
                </div>
                <div className="stats-row">{ getButton('fate', 'Fate') }</div>
                <div className="stats-row">{ getButton('honor', 'Honor') }</div>
            </div>
        </div>
    );
}

PlayerStatsBox.displayName = 'PlayerStatsBox';

export default PlayerStatsBox;
