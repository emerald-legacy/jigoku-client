import React from "react";

import type { OnlineUserStatus } from "../../types/game";

const GLYPHS: Record<OnlineUserStatus, string> = {
    lobby: "◉",
    playing: "⚔",
    spectating: "◇"
};

interface UserRowProps {
    name: string;
    status: OnlineUserStatus;
    isPatron?: boolean;
}

export default function UserRow({ name, status, isPatron }: UserRowProps) {
    return (
        <li className="samurai-row" data-status={ status }>
            <span className="samurai-glyph" aria-hidden="true">{ GLYPHS[status] }</span>
            <span className={ `samurai-name${isPatron ? " samurai-name--patron" : ""}` }>{ name }</span>
        </li>
    );
}
