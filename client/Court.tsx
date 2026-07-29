import CourtRoll from "./components/Court/CourtRoll";
import { useAppSelector } from "./hooks";
import type { OnlineUser } from "./types/game";

function byName(a: OnlineUser, b: OnlineUser) {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

export function InnerCourt({ users, username }: { users: OnlineUser[]; username?: string }) {
    const others = users.filter(user => user.name !== username);
    const atCourt = others.filter(user => user.status === "lobby").sort(byName);
    const watching = others.filter(user => user.status === "spectating").sort(byName);

    return (
        <div className="court">
            <div className="panel-title text-center">
                The Court
            </div>
            <div className="panel court-body">
                <span className="court-seal" aria-hidden="true">侍</span>

                { atCourt.length === 0 ? (
                    <div className="court-empty">
                        <strong>No one is waiting</strong>
                        Start a game and it will show in the list for everyone online.
                    </div>
                ) : (
                    <>
                        <div className="court-summary">
                            <span className="court-count">{ atCourt.length }</span>
                            <span className="court-count-label">
                                { atCourt.length === 1 ? "player waiting for an opponent" : "players waiting for an opponent" }
                            </span>
                        </div>
                        <CourtRoll users={ atCourt } status="lobby" />
                    </>
                ) }

                { watching.length > 0 && (
                    <section className="court-group">
                        <header className="court-group-header">
                            <span className="court-group-label">Watching</span>
                            <span className="court-group-count">{ watching.length }</span>
                        </header>
                        <CourtRoll users={ watching } status="spectating" />
                    </section>
                ) }
            </div>
        </div>
    );
}

InnerCourt.displayName = "Court";

export default function Court() {
    const users = useAppSelector(state => state.games.users) as OnlineUser[] | undefined;
    const username = useAppSelector(state => state.auth.username) as string | undefined;

    return <InnerCourt users={ users ?? [] } username={ username } />;
}
