// User and auth types

export interface User {
    _id?: string;
    username: string;
    email?: string;
    emailHash?: string;
    noAvatar?: boolean;
    registered?: string;
    settings?: import("./game").UserSettings;
    permissions?: Record<string, boolean>;
    disabled?: boolean;
    verified?: boolean;
    linkedAccounts?: Record<string, any>;
}

export interface AuthState {
    user?: User;
    username?: string;
    token?: string;
    isAdmin?: boolean;
    loggedIn?: boolean;
}

export interface UserState {
    blockList?: string[];
    blockListAdded?: boolean;
    blockListDeleted?: boolean;
}
