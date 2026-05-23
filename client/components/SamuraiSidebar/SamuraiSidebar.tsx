import React, { useState } from "react";
import { X, Menu } from "lucide-react";

import CollapsedRail from "./CollapsedRail";
import UserGroup from "./UserGroup";
import { useAppSelector } from "../../hooks";
import type { OnlineUser } from "../../types/game";

function partition(users: OnlineUser[]) {
    const lobby: OnlineUser[] = [];
    const playing: OnlineUser[] = [];
    const spectating: OnlineUser[] = [];
    for(const u of users) {
        if(u.status === "playing") {
            playing.push(u);
        } else if(u.status === "spectating") {
            spectating.push(u);
        } else {
            lobby.push(u);
        }
    }
    return { lobby, playing, spectating };
}

export default function SamuraiSidebar() {
    const users = useAppSelector(state => state.games.users) as OnlineUser[] | undefined;
    const [expanded, setExpanded] = useState(false);

    const list = users ?? [];
    const groups = partition(list);

    return (
        <aside className={ `samurai${expanded ? " samurai-expanded" : " samurai-collapsed"}` } aria-label="Online players">
            { expanded ? (
                <div className="samurai-panel">
                    <header className="samurai-header">
                        <span className="samurai-title">Samurai</span>
                        <span className="samurai-total">{ list.length }</span>
                        <button type="button" className="samurai-close" aria-label="Close samurai sidebar" onClick={ () => setExpanded(false) }>
                            <X size={ 16 } />
                        </button>
                    </header>
                    <div className="samurai-groups">
                        <UserGroup label="At Court" status="lobby" users={ groups.lobby } />
                        <UserGroup label="Dueling" status="playing" users={ groups.playing } />
                        <UserGroup label="Watching" status="spectating" users={ groups.spectating } />
                    </div>
                </div>
            ) : (
                <>
                    <div className="samurai-desktop-only">
                        <CollapsedRail
                            counts={ { lobby: groups.lobby.length, playing: groups.playing.length, spectating: groups.spectating.length } }
                            onExpand={ () => setExpanded(true) }
                        />
                    </div>
                    <button
                        type="button"
                        className="samurai-burger samurai-mobile-only"
                        aria-label="Open samurai sidebar"
                        aria-expanded="false"
                        onClick={ () => setExpanded(true) }
                    >
                        <Menu size={ 16 } />
                    </button>
                </>
            ) }
        </aside>
    );
}
