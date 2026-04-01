
const clanOrder = ['crab', 'crane', 'dragon', 'lion', 'phoenix', 'scorpion', 'unicorn'];

const reasonLabels = {
    conquest: 'Conquest',
    dishonor: 'Dishonor',
    honor: 'Honor',
    concede: 'Concession',
    other: 'Other'
};

function DeckStats({ stats }) {
    if(!stats) {
        return (
            <div className="deck-stats">
                <div className="deck-stats-title">No games recorded</div>
            </div>
        );
    }

    const { totalWins, totalLosses, byOpponentClan, byWinReason, byLossReason } = stats;
    const totalGames = totalWins + totalLosses;

    if(totalGames === 0) {
        return (
            <div className="deck-stats">
                <div className="deck-stats-title">No games recorded</div>
            </div>
        );
    }

    const winRate = Math.round((totalWins / totalGames) * 100);

    const clanEntries = clanOrder
        .filter(clan => byOpponentClan[clan] && (byOpponentClan[clan].wins > 0 || byOpponentClan[clan].losses > 0))
        .map(clan => ({
            clan,
            wins: byOpponentClan[clan].wins,
            losses: byOpponentClan[clan].losses
        }));

    const reasonEntries = Object.keys(reasonLabels)
        .filter(key => (byWinReason[key] || 0) > 0 || (byLossReason[key] || 0) > 0)
        .map(key => ({
            key,
            label: reasonLabels[key],
            wins: byWinReason[key] || 0,
            losses: byLossReason[key] || 0
        }));

    return (
        <div className="deck-stats">
            <div className="deck-stats-title">
                Record: { totalWins }W / { totalLosses }L ({ winRate }%)
            </div>
            { clanEntries.length > 0 && (
                <div className="deck-stats-clans">
                    { clanEntries.map(({ clan, wins, losses }) => (
                        <div key={ clan } className="deck-stats-clan">
                            <img
                                className="deck-stats-clan-icon"
                                src={ `/img/mons/${clan}.png` }
                                title={ clan }
                            />
                            <span>{ wins }/{ losses }</span>
                        </div>
                    )) }
                </div>
            ) }
            { reasonEntries.length > 0 && (
                <div className="deck-stats-reasons">
                    { reasonEntries.map(({ key, label, wins, losses }) => (
                        <span key={ key } className="deck-stats-reason">
                            { label }: { wins }W { losses }L
                        </span>
                    )) }
                </div>
            ) }
        </div>
    );
}

DeckStats.displayName = 'DeckStats';

export default DeckStats;
