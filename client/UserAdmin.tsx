import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";

import AlertPanel from "./SiteComponents/AlertPanel";
import Input from "./FormComponents/Input";
import Checkbox from "./FormComponents/Checkbox";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";
import type { User } from "./types/user";

const defaultPermissions: Record<string, boolean> = {
    canEditNews: false,
    canManageUsers: false,
    canViewGameErrors: false
};

const permissionsList = [
    { name: "canEditNews", label: "News Editor" },
    { name: "canManageUsers", label: "User Manager" },
    { name: "canViewGameErrors", label: "Game Errors Viewer" }
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

    const onFindClick = (event: React.MouseEvent) => {
        event.preventDefault();
        findUser(username);
    };

    const onSaveClick = (event: React.MouseEvent) => {
        event.preventDefault();
        if(currentUser) {
            currentUser.permissions = permissions;
            saveUser(currentUser);
        }
    };

    const onPermissionToggle = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
        setPermissions((prev: Record<string, boolean>) => ({
            ...prev,
            [field]: event.target.checked
        }));
    };

    let content = null;
    let successPanel = null;

    if(userSaved) {
        successPanel = (
            <AlertPanel message="User saved successfully" type="success" />
        );
    }

    const notFoundMessage = apiStatus === 404 ? <AlertPanel type="warning" message="No users found" /> : null;

    let renderedUser = null;

    if(currentUser) {
        const permissionsElements = permissionsList.map((permission) => (
            <Checkbox
                key={ permission.name }
                name={ `permissions.${permission.name}` }
                label={ permission.label }
                fieldClass="col-sm-offset-3 col-sm-4"
                onChange={ (e: React.ChangeEvent<HTMLInputElement>) => onPermissionToggle(permission.name, e) }
                checked={ permissions[permission.name] }
            />
        ));

        renderedUser = (
            <div>
                <h3>User details</h3>

                <form className="form">
                    <dl>
                        <dt>Username:</dt><dd>{ currentUser.username }</dd>
                        <dt>Email:</dt><dd>{ currentUser.email }</dd>
                        <dt>Registered:</dt><dd>{ currentUser.registered }</dd>
                    </dl>

                    <h4>Permissions</h4>
                    { permissionsElements }
                    <button type="button" className="btn btn-primary" onClick={ onSaveClick }>Save</button>
                </form>
            </div>
        );
    }

    if(loading) {
        content = <div>Searching for user...</div>;
    } else if(apiError && apiStatus !== 404) {
        content = <AlertPanel type="error" message={ apiError } />;
    } else {
        content = (
            <div>
                { notFoundMessage }
                { successPanel }
                <form className="form">
                    <Input name="username" label="Search for a user" value={ username } onChange={ onUsernameChange } placeholder="Enter username" />
                    <button type="submit" className="btn btn-primary" onClick={ onFindClick }>Find</button>
                </form>

                { renderedUser }
            </div>
        );
    }

    return content;
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
