import { useState } from "react";

const clanOrder = ["crab", "crane", "dragon", "lion", "phoenix", "scorpion", "unicorn"];

const tabs = [
    { key: "all", label: "All" },
    { key: "emerald", label: "Emerald" },
    { key: "sanctuary", label: "Sanctuary" },
    { key: "stronghold", label: "Imperial" }
];

function GameStats({ stats }) {
    const [activeTab, setActiveTab] = useState("all");
    const [expandedClan, setExpandedClan] = useState(null);

    if(!stats) {
        return null;
    }

    const modeStats = stats[activeTab];

    const toggleClan = (clan) => {
        setExpandedClan(expandedClan === clan ? null : clan);
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        setExpandedClan(null);
    };

    return (
        <div className="game-stats">
            <div className="panel-title text-center">
                Game Statistics <span className="game-stats-period">(Last 30 Days)</span>
            </div>
            <div className="panel game-stats-body">
                <div className="game-stats-tabs">
                    { tabs.map(tab => (
                        <button
                            key={ tab.key }
                            className={ `game-stats-tab${activeTab === tab.key ? " active" : ""}` }
                            onClick={ () => handleTabChange(tab.key) }
                        >
                            { tab.label }
                        </button>
                    )) }
                </div>
                { !modeStats || modeStats.totalGames === 0 ? (
                    <div className="game-stats-empty">No recent games</div>
                ) : (
                    <>
                        <div className="game-stats-total">{ modeStats.totalGames } games played</div>
                        <div className="game-stats-clans">
                            { clanOrder.map(clan => {
                                const data = modeStats.clanStats.find(c => c.clan === clan);
                                if(!data || data.gamesPlayed === 0) {
                                    return null;
                                }

                                const hasMatchups = data.matchups && Object.keys(data.matchups).length > 0;
                                const isExpanded = expandedClan === clan;

                                return (
                                    <div key={ clan } className={ `game-stats-clan-row${isExpanded ? " expanded" : ""}` }>
                                        <div
                                            className={ `game-stats-clan${hasMatchups ? " clickable" : ""}` }
                                            onClick={ hasMatchups ? () => toggleClan(clan) : undefined }
                                        >
                                            <img
                                                className="game-stats-clan-icon"
                                                src={ `/img/mons/${clan}.png` }
                                                title={ clan }
                                            />
                                            <span>{ data.gamesPlayed } played</span>
                                            <span className="game-stats-clan-wins">{ data.wins }W</span>
                                            { hasMatchups && (
                                                <span className="game-stats-expand">{ isExpanded ? "\u25B2" : "\u25BC" }</span>
                                            ) }
                                        </div>
                                        { isExpanded && data.matchups && (
                                            <div className="game-stats-matchups">
                                                <span className="game-stats-matchup-vs">vs.</span>
                                                { clanOrder.filter(opp => data.matchups[opp]).map(opp => {
                                                    const m = data.matchups[opp];
                                                    return (
                                                        <div key={ opp } className="game-stats-matchup">
                                                            <img
                                                                className="game-stats-clan-icon"
                                                                src={ `/img/mons/${opp}.png` }
                                                                title={ opp }
                                                            />
                                                            <span>{ m.winRate }%</span>
                                                            <span className="game-stats-matchup-detail">({ m.wins }/{ m.played })</span>
                                                        </div>
                                                    );
                                                }) }
                                            </div>
                                        ) }
                                    </div>
                                );
                            }) }
                        </div>
                        { modeStats.mostSuccessfulClans && modeStats.mostSuccessfulClans.length > 0 && (
                            <div className="game-stats-best">
                                <div className="game-stats-best-label">
                                    { activeTab === "stronghold" ? "In favor with the Emperor" : "In favor with the Empress" }
                                </div>
                                <div className="game-stats-best-clans">
                                    { modeStats.mostSuccessfulClans.map(({ clan, winRate }) => (
                                        <span key={ clan } className="game-stats-best-entry">
                                            <img
                                                className="game-stats-clan-icon"
                                                src={ `/img/mons/${clan}.png` }
                                                title={ clan }
                                            />
                                            <span className="game-stats-best-name">
                                                { clan } ({ winRate }% win rate)
                                            </span>
                                        </span>
                                    )) }
                                </div>
                            </div>
                        ) }
                    </>
                ) }
            </div>
        </div>
    );
}

GameStats.displayName = "GameStats";

export default GameStats;
