import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { UserCog, Search, ScrollText, ShieldCheck, Bug, KeyRound, Stamp, Users } from "lucide-react";

import AlertPanel from "./SiteComponents/AlertPanel";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";
import type { User } from "./types/user";
import type { LucideIcon } from "lucide-react";

const defaultPermissions: Record<string, boolean> = {
    canEditNews: false,
    canManageUsers: false,
    canViewGameErrors: false
};

const permissionsList: { name: string; label: string; desc: string; Icon: LucideIcon }[] = [
    { name: "canEditNews", label: "News Editor", desc: "Publish and edit the site's dispatches.", Icon: ScrollText },
    { name: "canManageUsers", label: "User Manager", desc: "Find players and grant their privileges.", Icon: ShieldCheck },
    { name: "canViewGameErrors", label: "Game Errors Viewer", desc: "Inspect server-side game error reports.", Icon: Bug }
];

interface InnerUserAdminProps {
    apiError?: string;
    apiStatus?: number;
    clearUserStatus: () => void;
    currentUser?: User;
    findUser: (username: string) => void;
    loading?: boolean;
    saveUser: (user: User) => void;
    userSaved?: boolean;
}

export function InnerUserAdmin({ apiError, apiStatus, clearUserStatus, currentUser, findUser, loading, saveUser, userSaved }: InnerUserAdminProps) {
    const [permissions, setPermissions] = useState<Record<string, boolean>>(currentUser ? (currentUser.permissions || defaultPermissions) : defaultPermissions);
    const [username, setUsername] = useState("");

    useEffect(() => {
        setPermissions(currentUser ? (currentUser.permissions || defaultPermissions) : defaultPermissions);
    }, [currentUser]);

    useEffect(() => {
        if(userSaved) {
            const timer = setTimeout(() => {
                clearUserStatus();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [userSaved, clearUserStatus]);

    const onUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
    };

    const onFindSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        findUser(username);
    };

    const onSaveClick = (event: React.MouseEvent) => {
        event.preventDefault();
        if(currentUser) {
            saveUser({ ...currentUser, permissions });
        }
    };

    const onPermissionToggle = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
        setPermissions((prev: Record<string, boolean>) => ({
            ...prev,
            [field]: event.target.checked
        }));
    };

    const notFound = apiStatus === 404;
    const showError = !!apiError && !notFound;

    let body;
    if(loading) {
        body = <div className="user-admin-loading">Consulting the registry&hellip;</div>;
    } else if(currentUser) {
        body = (
            <div className="user-admin-dossier">
                <div className="user-admin-identity">
                    <span className="user-admin-name">{ currentUser.username }</span>
                    <div className="user-admin-meta">
                        <div className="user-admin-meta-item">
                            <span className="user-admin-meta-key">Email</span>
                            <span className="user-admin-meta-val">{ currentUser.email || "—" }</span>
                        </div>
                        <div className="user-admin-meta-item">
                            <span className="user-admin-meta-key">Registered</span>
                            <span className="user-admin-meta-val">{ currentUser.registered || "—" }</span>
                        </div>
                    </div>
                </div>

                <div className="user-admin-perms-title">
                    <KeyRound size={ 14 } aria-hidden="true" />
                    Privileges
                </div>

                { permissionsList.map((permission) => {
                    const on = !!permissions[permission.name];
                    const Icon = permission.Icon;
                    return (
                        <div key={ permission.name } className={ `user-admin-perm${on ? " is-on" : ""}` }>
                            <Icon size={ 18 } className="user-admin-perm-icon" aria-hidden="true" />
                            <div className="user-admin-perm-info">
                                <div className="user-admin-perm-label">{ permission.label }</div>
                                <div className="user-admin-perm-desc">{ permission.desc }</div>
                            </div>
                            <label className="user-admin-toggle">
                                <input
                                    type="checkbox"
                                    checked={ on }
                                    onChange={ (e: React.ChangeEvent<HTMLInputElement>) => onPermissionToggle(permission.name, e) }
                                    aria-label={ permission.label }
                                />
                                <span className="user-admin-toggle-track">
                                    <span className="user-admin-toggle-knob" />
                                </span>
                            </label>
                        </div>
                    );
                }) }

                <div className="user-admin-actions">
                    <button type="button" className="user-admin-save" onClick={ onSaveClick }>
                        <Stamp size={ 15 } aria-hidden="true" />
                        Seal &amp; Save
                    </button>
                </div>
            </div>
        );
    } else {
        body = (
            <div className="user-admin-placeholder">
                <Users size={ 20 } aria-hidden="true" />
                Search for a user to review and grant their privileges.
            </div>
        );
    }

    return (
        <div className="user-admin">
            <div className="panel-title">
                <UserCog size={ 15 } className="panel-title-icon" aria-hidden="true" />
                <span>User Administration</span>
                <span className="panel-title-meta">Registry</span>
            </div>

            <div className="panel panel-darker">
                <form className="user-admin-search" onSubmit={ onFindSubmit }>
                    <div className="user-admin-field">
                        <Search size={ 15 } className="user-admin-field-icon" aria-hidden="true" />
                        <input
                            className="user-admin-input"
                            value={ username }
                            onChange={ onUsernameChange }
                            placeholder="Search by username…"
                            aria-label="Username"
                        />
                    </div>
                    <button type="submit" className="user-admin-btn">
                        <Search size={ 14 } aria-hidden="true" />
                        Find
                    </button>
                </form>

                { userSaved ? <AlertPanel type="success" message="User saved successfully" /> : null }
                { notFound ? <AlertPanel type="warning" message="No users found" /> : null }
                { showError ? <AlertPanel type="error" message={ apiError } /> : null }

                { body }
            </div>
        </div>
    );
}

InnerUserAdmin.displayName = "UserAdmin";

function mapStateToProps(state: RootState) {
    return {
        apiError: state.api.message,
        apiStatus: state.api.status,
        currentUser: state.admin.currentUser,
        loading: state.admin.loading,
        userSaved: state.admin.userSaved
    };
}

export default function UserAdmin() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    const merged = { ...props, ...boundActions } as InnerUserAdminProps;
    return <InnerUserAdmin { ...merged } />;
}
