import React from "react";

import type { OnlineUser } from "../../types/game";

const GLYPHS = {
    lobby: "◉",
    spectating: "◇"
} as const;

export type CourtStatus = keyof typeof GLYPHS;

interface CourtRollProps {
    users: OnlineUser[];
    status: CourtStatus;
}

export default function CourtRoll({ users, status }: CourtRollProps) {
    return (
        <ul className="court-roll" data-status={ status }>
            { users.map(user => (
                <li key={ user.name } className="court-row">
                    <span className="court-glyph" aria-hidden="true">{ GLYPHS[status] }</span>
                    <span className={ `court-name${user.isPatron ? " court-name--patron" : ""}` }>{ user.name }</span>
                </li>
            )) }
        </ul>
    );
}
