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
}

export default function UserRow({ name, status }: UserRowProps) {
    return (
        <li className="samurai-row" data-status={ status }>
            <span className="samurai-glyph" aria-hidden="true">{ GLYPHS[status] }</span>
            <span className="samurai-name">{ name }</span>
        </li>
    );
}
