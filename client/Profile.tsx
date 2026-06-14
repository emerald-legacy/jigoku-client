import React, { useEffect, useReducer } from "react";
import { shallowEqual } from "react-redux";
import type { RootState } from "./types/redux";
import type { User } from "./types/user";

import AlertPanel from "./SiteComponents/AlertPanel";
import Input from "./FormComponents/Input";
import Checkbox from "./FormComponents/Checkbox";

import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "./hooks";
import { saveProfile } from "./ReduxActions/user";
import {
    initProfileState,
    profileReducer,
    validateEmail,
    validatePassword,
    type ProfileUserLike
} from "./Profile.reducer";
import { backgrounds } from "./backgrounds";
import { DialPicker, TokenPicker, PromoPicker } from "./ProfileCosmetics";
import { asset } from "./assetUrl";

const windows = [
    { name: "dynasty", label: "Dynasty phase", style: "col-sm-4" },
    { name: "draw", label: "Draw phase", style: "col-sm-4" },
    { name: "preConflict", label: "Conflict phase", style: "col-sm-4" },
    { name: "conflict", label: "During conflict", style: "col-sm-4" },
    { name: "fate", label: "Fate phase", style: "col-sm-4" }
];

interface InnerProfileProps {
    user?: User & { promptedActionWindows?: Record<string, boolean> };
}

export function InnerProfile({ user }: InnerProfileProps) {
    const reduxDispatch = useAppDispatch();
    const [state, dispatch] = useReducer(profileReducer, user as ProfileUserLike | undefined, initProfileState);
    const { account, settings, validation, loading } = state;

    useEffect(() => {
        if(user) {
            dispatch({ type: "hydrate", user: user as ProfileUserLike });
        }
    }, [user]);

    const setAccount = (field: keyof typeof account) => (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: "account", field, value: event.target.value });
    };

    const handleEmailBlur = () => {
        dispatch({ type: "validation", field: "email", error: validateEmail(account.email) });
    };

    const handlePasswordBlur = () => {
        dispatch({ type: "validation", field: "password", error: validatePassword(account.newPassword, account.newPasswordAgain, false) });
    };

    const handleSaveClick = async (event: React.MouseEvent) => {
        event.preventDefault();

        if(!user) {
            return;
        }

        const emailError = validateEmail(account.email);
        const passwordError = validatePassword(account.newPassword, account.newPasswordAgain, true);
        dispatch({ type: "validation", field: "email", error: emailError });
        dispatch({ type: "validation", field: "password", error: passwordError });

        if(emailError || passwordError) {
            const message = "There was an error in one or more fields, please see below, correct the error and try again";
            dispatch({ type: "submitError", message });
            toast.error(message, { id: "profile-save" });
            return;
        }

        const emailChanged = !!user && account.email !== user.email;
        const passwordChanged = account.newPassword.length > 0;
        if((emailChanged || passwordChanged) && !account.currentPassword) {
            const message = "Please enter your current password to change your email or password";
            dispatch({ type: "submitError", message });
            toast.error(message, { id: "profile-save" });
            return;
        }

        dispatch({ type: "submitStart" });

        try {
            await reduxDispatch(saveProfile({
                user,
                payload: {
                    email: account.email,
                    password: account.newPassword,
                    currentPassword: account.currentPassword,
                    promptedActionWindows: settings.promptedActionWindows,
                    settings: {
                        disableGravatar: settings.disableGravatar,
                        windowTimer: settings.windowTimer,
                        optionSettings: settings.optionSettings,
                        timerSettings: settings.timerSettings,
                        background: settings.background,
                        cardSize: settings.cardSize,
                        patron: settings.patron
                    }
                }
            })).unwrap();
            const message = "Profile saved successfully. Please note settings changed here will only apply at the start of your next game";
            dispatch({ type: "submitSuccess", message });
            toast.success(message, { id: "profile-save" });
        } catch(err) {
            const rawMessage = err instanceof Error
                ? err.message
                : typeof err === "string" ? err : undefined;
            const message = rawMessage || "An error occurred while saving your profile";
            dispatch({ type: "submitError", message });
            toast.error(message, { id: "profile-save" });
        }
    };

    const handleSlideStop = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(event.target.value);

        if(Number.isNaN(value)) {
            return;
        }

        if(value < 0) {
            value = 0;
        }

        if(value > 10) {
            value = 10;
        }

        dispatch({ type: "setting", field: "windowTimer", value });
    };

    const windowsElements = windows.map(window => (
        <Checkbox
            key={ window.name }
            noGroup
            name={ `promptedActionWindows.${window.name}` }
            label={ window.label }
            fieldClass={ window.style }
            onChange={ (e) => dispatch({ type: "toggle", map: "promptedActionWindows", field: window.name, value: e.target.checked }) }
            checked={ settings.promptedActionWindows[window.name] }
        />
    ));

    if(!user) {
        return <AlertPanel type="error" message="You must be logged in to update your profile" />;
    }

    const isPatron = !!user.permissions?.isPatron;

    return (
        <div className="row profile full-height">
            <div className="col-xs-12 about-container">
                <form className="form form-horizontal profile-form">
                    <div className="row profile-row">
                        <div className="col-md-6">
                            <div className="panel-title">
                                Profile
                            </div>
                            <div className="panel">
                                <Input name="email" label="Email Address" labelClass="col-sm-4" fieldClass="col-sm-8" placeholder="Enter email address"
                                    type="text" onChange={ setAccount("email") } value={ account.email }
                                    onBlur={ handleEmailBlur } validationMessage={ validation.email } />
                                <Input name="newPassword" label="New Password" labelClass="col-sm-4" fieldClass="col-sm-8" placeholder="Enter new password"
                                    type="password" onChange={ setAccount("newPassword") } value={ account.newPassword }
                                    onBlur={ handlePasswordBlur } validationMessage={ validation.password } />
                                <Input name="newPasswordAgain" label="New Password (again)" labelClass="col-sm-4" fieldClass="col-sm-8" placeholder="Enter new password (again)"
                                    type="password" onChange={ setAccount("newPasswordAgain") } value={ account.newPasswordAgain }
                                    onBlur={ handlePasswordBlur } validationMessage={ validation.password1 } />
                                <Input name="currentPassword" label="Current Password" labelClass="col-sm-4" fieldClass="col-sm-8" placeholder="Required to change email or password"
                                    type="password" onChange={ setAccount("currentPassword") } value={ account.currentPassword } />
                                <Checkbox name="disableGravatar" label="Disable Gravatar integration" fieldClass="col-sm-offset-4 col-sm-8"
                                    onChange={ (e) => dispatch({ type: "setting", field: "disableGravatar", value: e.target.checked }) } checked={ settings.disableGravatar } />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="panel-title">
                                Action window defaults
                            </div>
                            <div className="panel">
                                <p className="panel-help">If an option is selected here, you will always be prompted if you want to take an action in that window.  If an option is not selected, you will receive no prompts for that window.  For some windows (e.g. dominance) this could mean the whole window is skipped.</p>
                                <div className="form-group">
                                    { windowsElements }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row profile-row">
                        <div className="col-md-6">
                            <div className="panel-title">
                                Timed Bluff Window
                            </div>
                            <div className="panel">
                                <p className="panel-help">A bluff window prompts you to act even when you have no event to play, making it harder for opponents to read your hand. It appears only when you have no usable ability, and auto-passes once the timer below runs out. Use the toggles to choose when it shows.</p>
                                <div className="form-group">
                                    <label className="col-sm-3 control-label">Window timeout</label>
                                    <div className="col-sm-5">
                                        <input type="range"
                                            className="form-control"
                                            value={ settings.windowTimer }
                                            onChange={ handleSlideStop }
                                            step={ 1 }
                                            max={ 10 }
                                            min={ 0 } />
                                    </div>
                                    <div className="col-sm-2">
                                        <input className="form-control text-center" name="timer" value={ settings.windowTimer } onChange={ handleSlideStop } />
                                    </div>
                                    <label className="col-sm-1 control-label">seconds</label>
                                </div>
                                <div className="form-group timer-toggles">
                                    <Checkbox name="timerSettings.events" noGroup label="Show timer for opponent's events" fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "timerSettings", field: "events", value: e.target.checked }) } checked={ !!settings.timerSettings.events } />
                                    <Checkbox name="timerSettings.abilities" noGroup label="Show timer for events in my deck" fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "timerSettings", field: "eventsInDeck", value: e.target.checked }) } checked={ !!settings.timerSettings.eventsInDeck } />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="panel-title">
                                Options
                            </div>
                            <div className="panel">
                                <div className="form-group">
                                    <Checkbox
                                        name="optionSettings.markCardsUnselectable"
                                        noGroup
                                        label="Grey out cards with no relevant abilities during interrupt/reaction windows"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "markCardsUnselectable", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.markCardsUnselectable }
                                    />
                                    <Checkbox
                                        name="optionSettings.cancelOwnAbilities"
                                        noGroup
                                        label="Prompt to cancel/react to initiation of my own abilities"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "cancelOwnAbilities", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.cancelOwnAbilities } />
                                    <Checkbox
                                        name="optionSettings.orderForcedAbilities"
                                        noGroup
                                        label="Prompt to order forced triggered/simultaneous abilities"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "orderForcedAbilities", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.orderForcedAbilities }
                                    />
                                    <Checkbox
                                        name="optionSettings.confirmOneClick"
                                        noGroup
                                        label="Show a confirmation prompt when initating 1-click abilities"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "confirmOneClick", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.confirmOneClick }
                                    />
                                    <Checkbox
                                        name="optionSettings.disableCardStats"
                                        noGroup
                                        label="Disable card hover statistics popup"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "disableCardStats", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.disableCardStats }
                                    />
                                    <Checkbox
                                        name="optionSettings.hideEffectMarkers"
                                        noGroup
                                        label="Hide effect markers on cards (info still in hover popup)"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "hideEffectMarkers", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.hideEffectMarkers }
                                    />
                                    <Checkbox
                                        name="optionSettings.sortHandByName"
                                        noGroup
                                        label="Sort Hand by Name"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "sortHandByName", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.sortHandByName }
                                    />
                                    <Checkbox
                                        name="optionSettings.showRingEffects"
                                        noGroup
                                        label="Show ring effect descriptions on hover"
                                        fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "showRingEffects", value: e.target.checked }) }
                                        checked={ !!settings.optionSettings.showRingEffects }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="panel-title">
                                Card Image Size
                            </div>
                            <div className="panel">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "small" }) }>
                                            <div className={ `card small vertical${settings.cardSize === "small" ? " selected" : ""}` }>
                                                <img className="card small vertical"
                                                    src={ asset("cardbacks/dynastycardback.webp") } />
                                            </div>
                                            <span className="bg-label">Small</span>
                                        </div>
                                        <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "normal" }) }>
                                            <div className={ `card vertical${settings.cardSize === "normal" ? " selected" : ""}` }>
                                                <img className="card vertical"
                                                    src={ asset("cardbacks/dynastycardback.webp") } />
                                            </div>
                                            <span className="bg-label">Normal</span>
                                        </div>
                                        <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "large" }) }>
                                            <div className={ `card vertical large${settings.cardSize === "large" ? " selected" : ""}` }>
                                                <img className="card-image large vertical"
                                                    src={ asset("cardbacks/dynastycardback.webp") } />
                                            </div>
                                            <span className="bg-label">Large</span>
                                        </div>
                                        <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "x-large" }) }>
                                            <div className={ `card vertical x-large${settings.cardSize === "x-large" ? " selected" : ""}` }>
                                                <img className="card-image x-large vertical"
                                                    src={ asset("cardbacks/dynastycardback.webp") } />
                                            </div>
                                            <span className="bg-label">Extra-Large</span>
                                        </div>
                                        <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "xxl" }) }>
                                            <div className={ `card vertical xxl${settings.cardSize === "xxl" ? " selected" : ""}` }>
                                                <img className="card-image xxl vertical"
                                                    src={ asset("cardbacks/dynastycardback.webp") } />
                                            </div>
                                            <span className="bg-label">XXL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="panel-title">
                                Board Cosmetics
                            </div>
                            <div className="panel">
                                <p className="panel-help">Choose the honor dial and tokens you play with. Everyone gets the wood and etched sets; patrons unlock nacre and gold. Your dial is shown to opponents and spectators; your tokens appear only on your own client.</p>
                                <label className="control-label">Honor dial</label>
                                <DialPicker
                                    value={ settings.patron.dial }
                                    isPatron={ isPatron }
                                    onChange={ (value) => dispatch({ type: "patron", field: "dial", value }) }
                                />
                                <label className="control-label cosmetic-section-label">Fate, Honor, and First Player tokens</label>
                                <TokenPicker
                                    value={ settings.patron.tokens }
                                    isPatron={ isPatron }
                                    onChange={ (value) => dispatch({ type: "patron", field: "tokens", value }) }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="panel-title">
                                Card Cosmetics
                            </div>
                            <div className="panel">
                                <p className="panel-help">Patrons can play with alternate promo card art. When enabled, your opponents and spectators see promo art on your cards wherever a promo exists.</p>
                                <PromoPicker
                                    value={ settings.patron.usePromos }
                                    isPatron={ isPatron }
                                    onChange={ (value) => dispatch({ type: "patron", field: "usePromos", value }) }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="panel-title">
                                Game Board Background
                            </div>
                            <div className="panel">
                                <div className="bg-grid">
                                    { backgrounds.map(bg => (
                                        <div key={ bg.value } className="bg-swatch" onClick={ () => dispatch({ type: "setting", field: "background", value: bg.value }) }>
                                            <img className={ `img-responsive${settings.background === bg.value ? " selected" : ""}` } src={ bg.thumbnail } />
                                            <span className="bg-label">{ bg.label }</span>
                                        </div>
                                    )) }
                                </div>
                            </div>
                        </div>
                    </div>
                    { /* Patron ring picker — hidden until a patron ring set exists. The setting
                        (settings.patron.rings) and its resolvers are still wired; re-enable by
                        restoring this block once ring art is available.
                    { isPatron ? (
                        <div>
                            <div className="panel-title">
                                Patron Extras
                            </div>
                            <div className="panel">
                                <p className="panel-help">Thanks for supporting us!</p>
                                <div className="form-group">
                                    <Checkbox name="patron.rings" noGroup label="Use patron ring set" fieldClass="col-sm-6"
                                        onChange={ (e) => dispatch({ type: "patron", field: "rings", value: e.target.checked }) } checked={ settings.patron.rings } />
                                </div>
                            </div>
                        </div>
                    ) : null }
                    */ }
                    <div className="profile-actions">
                        <button className="btn profile-save" type="button" disabled={ loading } onClick={ handleSaveClick }>
                            { loading ? "Saving…" : "Save changes" }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

InnerProfile.displayName = "Profile";

function mapStateToProps(state: RootState) {
    return {
        user: state.auth.user
    };
}

export default function Profile() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    return <InnerProfile { ...props } />;
}
