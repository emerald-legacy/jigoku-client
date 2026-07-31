import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";

import { ShieldBan, UserX, X } from "lucide-react";
import AlertPanel from "./SiteComponents/AlertPanel";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";
import type { User } from "./types/user";

interface InnerBlockListProps {
    addBlockListEntry: (arg: { user: User | undefined; username: string }) => void;
    apiError?: string;
    blockList?: string[];
    blockListAdded?: boolean;
    blockListDeleted?: boolean;
    clearBlockListStatus: () => void;
    loadBlockList: (user: User | undefined) => void;
    loading?: boolean;
    removeBlockListEntry: (arg: { user: User | undefined; username: string }) => void;
    user?: User;
}

export function InnerBlockList({
    addBlockListEntry,
    apiError,
    blockList,
    blockListAdded,
    blockListDeleted,
    clearBlockListStatus,
    loadBlockList,
    loading,
    removeBlockListEntry,
    user
}: InnerBlockListProps) {
    const [username, setUsername] = useState("");

    useEffect(() => {
        loadBlockList(user);
    }, [loadBlockList, user]);

    useEffect(() => {
        if(blockListAdded || blockListDeleted) {
            const timer = setTimeout(() => {
                clearBlockListStatus();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [blockListAdded, blockListDeleted, clearBlockListStatus]);

    const onUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
    };

    const onAddClick = (event: React.FormEvent | React.MouseEvent) => {
        event.preventDefault();
        if(!username) {
            return;
        }
        addBlockListEntry({ user, username });
        setUsername("");
    };

    const onRemoveClick = (usernameToRemove: string, event: React.MouseEvent) => {
        event.preventDefault();
        removeBlockListEntry({ user, username: usernameToRemove });
    };

    let successPanel;

    if(blockListAdded) {
        successPanel = (
            <AlertPanel message="Block list entry added successfully" type="success" />
        );
    }

    if(blockListDeleted) {
        successPanel = (
            <AlertPanel message="Block list entry removed successfully" type="success" />
        );
    }

    if(apiError && !loading) {
        return <AlertPanel type="error" message={ apiError } />;
    }

    const blockedCount = blockList ? blockList.length : 0;

    let entries: React.ReactNode;
    if(loading) {
        entries = Array.from({ length: 3 }, (_value, index) => (
            <li className="blocklist-entry blocklist-skeleton" key={ `skeleton-${index}` } aria-hidden="true">
                <UserX className="blocklist-entry-icon" size={ 16 } />
                <span className="blocklist-skeleton-block" />
            </li>
        ));
    } else if(blockedCount === 0) {
        entries = (
            <li className="blocklist-empty">
                Nobody is blocked. Add a username above to keep them out of your games.
            </li>
        );
    } else {
        entries = blockList?.map((blockedUser: string) => (
            <li className="blocklist-entry" key={ blockedUser }>
                <UserX className="blocklist-entry-icon" size={ 16 } aria-hidden="true" />
                <span className="blocklist-entry-name">{ blockedUser }</span>
                <button
                    type="button"
                    className="blocklist-remove"
                    aria-label={ `Unblock ${blockedUser}` }
                    title={ `Unblock ${blockedUser}` }
                    onClick={ (e) => onRemoveClick(blockedUser, e) }
                >
                    <X size={ 16 } aria-hidden="true" />
                </button>
            </li>
        ));
    }

    return (
        <div className="col-sm-8 col-sm-offset-2 full-height">
            <div className="about-container">
                { successPanel }

                <div className="panel-title text-center">
                    Block list
                </div>
                <div className="blocklist-panel">
                    <p className="blocklist-intro">
                        Blocked players cannot join games you host, and you will not see their chat
                        messages or their games in the lobby.
                    </p>

                    <form className="blocklist-add" onSubmit={ onAddClick }>
                        <div className="blocklist-add-field">
                            <label className="blocklist-add-label" htmlFor="blockee">Username</label>
                            <input
                                id="blockee"
                                name="blockee"
                                className="blocklist-add-input"
                                type="text"
                                placeholder="Who should be kept out?"
                                onChange={ onUsernameChange }
                                value={ username }
                            />
                        </div>
                        <button className="user-admin-btn" type="submit" disabled={ !username }>Block</button>
                    </form>

                    <div className="blocklist-section-title">
                        <ShieldBan size={ 14 } aria-hidden="true" />
                        Blocked
                        { !loading && blockedCount > 0 && (
                            <span className="blocklist-count">{ blockedCount }</span>
                        ) }
                    </div>
                    <ul className="blocklist-entries" aria-busy={ loading }>
                        { entries }
                    </ul>
                </div>
            </div>
        </div>
    );
}

InnerBlockList.displayName = "BlockList";

function mapStateToProps(state: RootState) {
    return {
        apiError: state.api.message,
        blockList: state.user.blockList,
        blockListAdded: state.user.blockListAdded,
        blockListDeleted: state.user.blockListDeleted,
        loading: state.user.loading,
        user: state.auth.user
    };
}

export default function BlockList() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    const merged = { ...props, ...boundActions } as InnerBlockListProps;
    return <InnerBlockList { ...merged } />;
}
