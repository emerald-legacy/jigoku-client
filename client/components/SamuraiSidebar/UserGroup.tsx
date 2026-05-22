import React from "react";

import UserRow from "./UserRow";
import type { OnlineUser, OnlineUserStatus } from "../../types/game";

interface UserGroupProps {
    label: string;
    status: OnlineUserStatus;
    users: OnlineUser[];
}

export default function UserGroup({ label, status, users }: UserGroupProps) {
    if(users.length === 0) {
        return null;
    }

    return (
        <section className="samurai-group" data-group={ status }>
            <header className="samurai-group-header">
                <span className="samurai-group-label">{ label }</span>
                <span className="samurai-group-count">{ users.length }</span>
            </header>
            <ul className="samurai-group-list">
                { users.map(u => (
                    <UserRow key={ u.name } name={ u.name } status={ u.status } />
                )) }
            </ul>
        </section>
    );
}
