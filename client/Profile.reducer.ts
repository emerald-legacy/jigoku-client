import type { User } from "./types/user";

export interface ProfileAccount {
    email: string;
    currentPassword: string;
    newPassword: string;
    newPasswordAgain: string;
}

export interface ProfileSettings {
    disableGravatar: boolean;
    windowTimer: number;
    background: string;
    cardSize: string;
    promptedActionWindows: Record<string, boolean>;
    optionSettings: Record<string, any>;
    timerSettings: Record<string, any>;
}

export interface ProfileState {
    account: ProfileAccount;
    settings: ProfileSettings;
    validation: Record<string, string>;
    loading: boolean;
    errorMessage?: string;
    successMessage?: string;
}

export type ToggleMap = "promptedActionWindows" | "optionSettings" | "timerSettings";

export type ProfileAction =
    | { type: "account"; field: keyof ProfileAccount; value: string }
    | { type: "setting"; field: "disableGravatar" | "windowTimer" | "background" | "cardSize"; value: boolean | number | string }
    | { type: "toggle"; map: ToggleMap; field: string; value: boolean }
    | { type: "validation"; field: string; error?: string }
    | { type: "submitStart" }
    | { type: "submitSuccess"; message: string }
    | { type: "submitError"; message: string }
    | { type: "hydrate"; user: ProfileUserLike };

export interface ProfileUserLike extends Partial<Pick<User, "email" | "settings">> {
    promptedActionWindows?: Record<string, boolean>;
}

export function initProfileState(user?: ProfileUserLike): ProfileState {
    return {
        account: {
            email: user?.email || "",
            currentPassword: "",
            newPassword: "",
            newPasswordAgain: ""
        },
        settings: {
            disableGravatar: user?.settings?.disableGravatar || false,
            windowTimer: user?.settings?.windowTimer || 0,
            background: user?.settings?.background || "none",
            cardSize: user?.settings?.cardSize || "normal",
            promptedActionWindows: user?.promptedActionWindows || {},
            optionSettings: user?.settings?.optionSettings || {},
            timerSettings: user?.settings?.timerSettings || {}
        },
        validation: {},
        loading: false
    };
}

export function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
    switch(action.type) {
        case "account":
            return { ...state, account: { ...state.account, [action.field]: action.value } };
        case "setting":
            return { ...state, settings: { ...state.settings, [action.field]: action.value } };
        case "toggle":
            return {
                ...state,
                settings: {
                    ...state.settings,
                    [action.map]: { ...state.settings[action.map], [action.field]: action.value }
                }
            };
        case "validation": {
            const next = { ...state.validation };
            if(action.error) {
                next[action.field] = action.error;
            } else {
                delete next[action.field];
            }
            return { ...state, validation: next };
        }
        case "submitStart":
            return { ...state, loading: true, errorMessage: undefined, successMessage: undefined };
        case "submitSuccess":
            return { ...state, loading: false, successMessage: action.message };
        case "submitError":
            return { ...state, loading: false, errorMessage: action.message };
        case "hydrate":
            return {
                ...state,
                account: { ...state.account, email: action.user.email || "" },
                settings: {
                    ...state.settings,
                    disableGravatar: action.user.settings?.disableGravatar || false,
                    promptedActionWindows: action.user.promptedActionWindows || {}
                }
            };
        default:
            return state;
    }
}

export function validateEmail(email: string): string | undefined {
    if(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        return "Please enter a valid email address";
    }
    return undefined;
}

export function validatePassword(newPassword: string, newPasswordAgain: string, isSubmitting: boolean): string | undefined {
    if(!newPassword && !newPasswordAgain) {
        return undefined;
    }
    if(newPassword.length < 6) {
        return "The password you specify must be at least 6 characters long";
    }
    if(isSubmitting && !newPasswordAgain) {
        return "Please enter your password again";
    }
    if(newPassword && newPasswordAgain && newPassword !== newPasswordAgain) {
        return "The passwords you have specified do not match";
    }
    return undefined;
}
