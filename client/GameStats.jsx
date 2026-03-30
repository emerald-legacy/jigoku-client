import { useState } from 'react';
import PropTypes from 'prop-types';

const clanOrder = ['crab', 'crane', 'dragon', 'lion', 'phoenix', 'scorpion', 'unicorn'];

function GameStats({ stats }) {
    const [expandedClan, setExpandedClan] = useState(null);

    if(!stats || stats.totalGames === 0) {
        return (
            <div className='game-stats panel'>
                <div className='game-stats-title'>No recent games</div>
            </div>
        );
    }

    const toggleClan = (clan) => {
        setExpandedClan(expandedClan === clan ? null : clan);
    };

    return (
        <div className='game-stats panel'>
            <div className='game-stats-title'>
                Game Statistics <span className='game-stats-period'>(Last 30 Days)</span>
            </div>
            <div className='game-stats-total'>{ stats.totalGames } games played</div>
            <div className='game-stats-clans'>
                { clanOrder.map(clan => {
                    const data = stats.clanStats.find(c => c.clan === clan);
                    if(!data || data.gamesPlayed === 0) {
                        return null;
                    }

                    const hasMatchups = data.matchups && Object.keys(data.matchups).length > 0;
                    const isExpanded = expandedClan === clan;

                    return (
                        <div key={ clan } className={ 'game-stats-clan-row' + (isExpanded ? ' expanded' : '') }>
                            <div
                                className={ 'game-stats-clan' + (hasMatchups ? ' clickable' : '') }
                                onClick={ hasMatchups ? () => toggleClan(clan) : undefined }
                            >
                                <img
                                    className='game-stats-clan-icon'
                                    src={ `/img/mons/${clan}.png` }
                                    title={ clan }
                                />
                                <span>{ data.gamesPlayed } played</span>
                                <span className='game-stats-clan-wins'>{ data.wins }W</span>
                                { hasMatchups && (
                                    <span className='game-stats-expand'>{ isExpanded ? '\u25B2' : '\u25BC' }</span>
                                ) }
                            </div>
                            { isExpanded && data.matchups && (
                                <div className='game-stats-matchups'>
                                    <span className='game-stats-matchup-vs'>vs.</span>
                                    { clanOrder.filter(opp => data.matchups[opp]).map(opp => {
                                        const m = data.matchups[opp];
                                        return (
                                            <div key={ opp } className='game-stats-matchup'>
                                                <img
                                                    className='game-stats-clan-icon'
                                                    src={ `/img/mons/${opp}.png` }
                                                    title={ opp }
                                                />
                                                <span>{ m.winRate }%</span>
                                                <span className='game-stats-matchup-detail'>({ m.wins }/{ m.played })</span>
                                            </div>
                                        );
                                    }) }
                                </div>
                            ) }
                        </div>
                    );
                }) }
            </div>
            { stats.mostSuccessfulClans && stats.mostSuccessfulClans.length > 0 && (
                <div className='game-stats-best'>
                    <div className='game-stats-best-label'>In favor with the Empress</div>
                    <div className='game-stats-best-clans'>
                        { stats.mostSuccessfulClans.map(({ clan, winRate }) => (
                            <span key={ clan } className='game-stats-best-entry'>
                                <img
                                    className='game-stats-clan-icon'
                                    src={ `/img/mons/${clan}.png` }
                                    title={ clan }
                                />
                                <span className='game-stats-best-name'>
                                    { clan } ({ winRate }% win rate)
                                </span>
                            </span>
                        )) }
                    </div>
                </div>
            ) }
        </div>
    );
}

GameStats.displayName = 'GameStats';
GameStats.propTypes = {
    stats: PropTypes.object
};

export default GameStats;
