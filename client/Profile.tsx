import React, { useEffect, useReducer } from "react";
import { connect } from "react-redux";
import type { RootState } from "./types/redux";
import type { User } from "./types/user";

import AlertPanel from "./SiteComponents/AlertPanel";
import Input from "./FormComponents/Input";
import Checkbox from "./FormComponents/Checkbox";

import { useAppDispatch } from "./hooks";
import { saveProfile } from "./ReduxActions/user";
import {
    initProfileState,
    profileReducer,
    validateEmail,
    validatePassword,
    type ProfileUserLike
} from "./Profile.reducer";

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
    const { account, settings, validation, loading, errorMessage, successMessage } = state;

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

        const emailError = validateEmail(account.email);
        const passwordError = validatePassword(account.newPassword, account.newPasswordAgain, true);
        dispatch({ type: "validation", field: "email", error: emailError });
        dispatch({ type: "validation", field: "password", error: passwordError });

        if(emailError || passwordError) {
            dispatch({ type: "submitError", message: "There was an error in one or more fields, please see below, correct the error and try again" });
            return;
        }

        const emailChanged = !!user && account.email !== user.email;
        const passwordChanged = account.newPassword.length > 0;
        if((emailChanged || passwordChanged) && !account.currentPassword) {
            dispatch({ type: "submitError", message: "Please enter your current password to change your email or password" });
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
                        cardSize: settings.cardSize
                    }
                }
            })).unwrap();
            dispatch({ type: "submitSuccess", message: "Profile saved successfully.  Please note settings changed here will only apply at the start of your next game" });
        } catch(err: any) {
            dispatch({ type: "submitError", message: err?.message || "An error occurred while saving your profile" });
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

    return (
        <div className="row profile full-height">
            <div className="col-sm-8 col-sm-offset-2 about-container">
                { errorMessage ? <AlertPanel type="error" message={ errorMessage } /> : null }
                { successMessage ? <AlertPanel type="success" message={ successMessage } /> : null }
                <form className="form form-horizontal">
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
                    <div>
                        <div className="panel-title">
                            Action window defaults
                        </div>
                        <div className="panel">
                            <p className="help-block small">If an option is selected here, you will always be prompted if you want to take an action in that window.  If an option is not selected, you will receive no prompts for that window.  For some windows (e.g. dominance) this could mean the whole window is skipped.</p>
                            <div className="form-group">
                                { windowsElements }
                            </div>
                        </div>
                        <div className="panel-title">
                            Timed Bluff Window
                        </div>
                        <div className="panel">
                            <p className="help-block small">Sometimes, it is useful to have the game prompt you to play an event, even when you can't play one, as it makes it more difficult for your opponent to deduce what you have in your hand. This 'bluff' window has a timer will count down.
                            At the end of that timer, the window will automatically pass. This option controls the duration of the timer.  The timer will only show when you *don't* have an ability which can be used. The timer can be configure to show when events are played by your opponent, or
                            to show when there's a window to play an event which you don't currently have in your hand.</p>
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

                                <Checkbox name="timerSettings.events" noGroup label="Show timer for opponent's events" fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "timerSettings", field: "events", value: e.target.checked }) } checked={ settings.timerSettings.events } />
                                <Checkbox name="timerSettings.abilities" noGroup label="Show timer for events in my deck" fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "timerSettings", field: "eventsInDeck", value: e.target.checked }) } checked={ settings.timerSettings.eventsInDeck } />
                            </div>
                        </div>
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
                                    checked={ settings.optionSettings.markCardsUnselectable }
                                />
                                <Checkbox
                                    name="optionSettings.cancelOwnAbilities"
                                    noGroup
                                    label="Prompt to cancel/react to initiation of my own abilities"
                                    fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "cancelOwnAbilities", value: e.target.checked }) }
                                    checked={ settings.optionSettings.cancelOwnAbilities } />
                                <Checkbox
                                    name="optionSettings.orderForcedAbilities"
                                    noGroup
                                    label="Prompt to order forced triggered/simultaneous abilities"
                                    fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "orderForcedAbilities", value: e.target.checked }) }
                                    checked={ settings.optionSettings.orderForcedAbilities }
                                />
                                <Checkbox
                                    name="optionSettings.confirmOneClick"
                                    noGroup
                                    label="Show a confirmation prompt when initating 1-click abilities"
                                    fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "confirmOneClick", value: e.target.checked }) }
                                    checked={ settings.optionSettings.confirmOneClick }
                                />
                                <Checkbox
                                    name="optionSettings.disableCardStats"
                                    noGroup
                                    label="Disable card hover statistics popup"
                                    fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "disableCardStats", value: e.target.checked }) }
                                    checked={ settings.optionSettings.disableCardStats }
                                />
                                <Checkbox
                                    name="optionSettings.sortHandByName"
                                    noGroup
                                    label="Sort Hand by Name"
                                    fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "sortHandByName", value: e.target.checked }) }
                                    checked={ settings.optionSettings.sortHandByName }
                                />
                                <Checkbox
                                    name="optionSettings.showRingEffects"
                                    noGroup
                                    label="Show ring effect descriptions on hover"
                                    fieldClass="col-sm-6"
                                    onChange={ (e) => dispatch({ type: "toggle", map: "optionSettings", field: "showRingEffects", value: e.target.checked }) }
                                    checked={ settings.optionSettings.showRingEffects }
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="panel-title">
                            Game Board Background
                        </div>
                        <div className="panel">
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "none" }) }>
                                    <img className={ `img-responsive${settings.background === "none" ? " selected" : ""}` }
                                        src="img/blank.png" />
                                    <span className="bg-label">None</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "CRAB" }) }>
                                    <img className={ `img-responsive${settings.background === "CRAB" ? " selected" : ""}` }
                                        src="/img/bgs/crab.jpg" />
                                    <span className="bg-label">Crab</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "CRAB2" }) }>
                                    <img className={ `img-responsive${settings.background === "CRAB2" ? " selected" : ""}` }
                                        src="/img/bgs/crab2.jpg" />
                                    <span className="bg-label">Crab 2</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "CRAB3" }) }>
                                    <img className={ `img-responsive${settings.background === "CRAB3" ? " selected" : ""}` }
                                        src="/img/bgs/crab3.jpg" />
                                    <span className="bg-label">Crab 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "CRANE" }) }>
                                    <img className={ `img-responsive${settings.background === "CRANE" ? " selected" : ""}` }
                                        src="/img/bgs/crane.jpg" />
                                    <span className="bg-label">Crane</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "CRANE2" }) }>
                                    <img className={ `img-responsive${settings.background === "CRANE2" ? " selected" : ""}` }
                                        src="/img/bgs/crane2.jpg" />
                                    <span className="bg-label">Crane 2</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "CRANE3" }) }>
                                    <img className={ `img-responsive${settings.background === "CRANE3" ? " selected" : ""}` }
                                        src="/img/bgs/crane3.jpg" />
                                    <span className="bg-label">Crane 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "CRANE4" }) }>
                                    <img className={ `img-responsive${settings.background === "CRANE4" ? " selected" : ""}` }
                                        src="/img/bgs/crane4.jpg" />
                                    <span className="bg-label">Crane 4</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "DRAGON" }) }>
                                    <img className={ `img-responsive${settings.background === "DRAGON" ? " selected" : ""}` }
                                        src="/img/bgs/dragon.jpg" />
                                    <span className="bg-label">Dragon</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "DRAGON2" }) }>
                                    <img className={ `img-responsive${settings.background === "DRAGON2" ? " selected" : ""}` }
                                        src="/img/bgs/dragon2.jpg" />
                                    <span className="bg-label">Dragon 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "DRAGON3" }) }>
                                    <img className={ `img-responsive${settings.background === "DRAGON3" ? " selected" : ""}` }
                                        src="/img/bgs/dragon3.jpg" />
                                    <span className="bg-label">Dragon 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "LION" }) }>
                                    <img className={ `img-responsive${settings.background === "LION" ? " selected" : ""}` }
                                        src="/img/bgs/lion.jpg" />
                                    <span className="bg-label">Lion</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "LION2" }) }>
                                    <img className={ `img-responsive${settings.background === "LION2" ? " selected" : ""}` }
                                        src="/img/bgs/lion2.jpg" />
                                    <span className="bg-label">Lion 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "LION3" }) }>
                                    <img className={ `img-responsive${settings.background === "LION3" ? " selected" : ""}` }
                                        src="/img/bgs/lion3.jpg" />
                                    <span className="bg-label">Lion 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "OTTER" }) }>
                                    <img className={ `img-responsive${settings.background === "OTTER" ? " selected" : ""}` }
                                        src="/img/bgs/otter.jpg" />
                                    <span className="bg-label">Otter</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "PHOENIX" }) }>
                                    <img className={ `img-responsive${settings.background === "PHOENIX" ? " selected" : ""}` }
                                        src="/img/bgs/phoenix.jpg" />
                                    <span className="bg-label">Phoenix</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "PHOENIX2" }) }>
                                    <img className={ `img-responsive${settings.background === "PHOENIX2" ? " selected" : ""}` }
                                        src="/img/bgs/phoenix2.jpg" />
                                    <span className="bg-label">Phoenix 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "PHOENIX3" }) }>
                                    <img className={ `img-responsive${settings.background === "PHOENIX3" ? " selected" : ""}` }
                                        src="/img/bgs/phoenix3.jpg" />
                                    <span className="bg-label">Phoenix 3</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "SCORPION" }) }>
                                    <img className={ `img-responsive${settings.background === "SCORPION" ? " selected" : ""}` }
                                        src="/img/bgs/scorpion.jpg" />
                                    <span className="bg-label">Scorpion</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "SCORPION2" }) }>
                                    <img className={ `img-responsive${settings.background === "SCORPION2" ? " selected" : ""}` }
                                        src="/img/bgs/scorpion2.jpg" />
                                    <span className="bg-label">Scorpion 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "SCORPION3" }) }>
                                    <img className={ `img-responsive${settings.background === "SCORPION3" ? " selected" : ""}` }
                                        src="/img/bgs/scorpion3.jpg" />
                                    <span className="bg-label">Scorpion 3</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "UNICORN" }) }>
                                    <img className={ `img-responsive${settings.background === "UNICORN" ? " selected" : ""}` }
                                        src="/img/bgs/unicorn.jpg" />
                                    <span className="bg-label">Unicorn</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "UNICORN2" }) }>
                                    <img className={ `img-responsive${settings.background === "UNICORN2" ? " selected" : ""}` }
                                        src="/img/bgs/unicorn2.jpg" />
                                    <span className="bg-label">Unicorn 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => dispatch({ type: "setting", field: "background", value: "UNICORN3" }) }>
                                    <img className={ `img-responsive${settings.background === "UNICORN3" ? " selected" : ""}` }
                                        src="/img/bgs/unicorn3.jpg" />
                                    <span className="bg-label">Unicorn 3</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="panel-title">
                            Card Image Size
                        </div>
                        <div className="panel">
                            <div className="row">
                                <div className="col-xs-12">
                                    <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "small" }) }>
                                        <div className={ `card small vertical${settings.cardSize === "small" ? " selected" : ""}` }>
                                            <img className="card small vertical"
                                                src="img/cards/dynastycardback.png" />
                                        </div>
                                        <span className="bg-label">Small</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "normal" }) }>
                                        <div className={ `card vertical${settings.cardSize === "normal" ? " selected" : ""}` }>
                                            <img className="card vertical"
                                                src="img/cards/dynastycardback.png" />
                                        </div>
                                        <span className="bg-label">Normal</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "large" }) }>
                                        <div className={ `card vertical large${settings.cardSize === "large" ? " selected" : ""}` }>
                                            <img className="card-image large vertical"
                                                src="/img/cards/dynastycardback.png" />
                                        </div>
                                        <span className="bg-label">Large</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "x-large" }) }>
                                        <div className={ `card vertical x-large${settings.cardSize === "x-large" ? " selected" : ""}` }>
                                            <img className="card-image x-large vertical"
                                                src="img/cards/dynastycardback.png" />
                                        </div>
                                        <span className="bg-label">Extra-Large</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => dispatch({ type: "setting", field: "cardSize", value: "xxl" }) }>
                                        <div className={ `card vertical xxl${settings.cardSize === "xxl" ? " selected" : ""}` }>
                                            <img className="card-image xxl vertical"
                                                src="img/cards/dynastycardback.png" />
                                        </div>
                                        <span className="bg-label">XXL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-offset-10 col-sm-2">
                        <button className="btn btn-primary" type="button" disabled={ loading } onClick={ handleSaveClick }>Save</button>
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

const Profile: React.ComponentType = connect(mapStateToProps)(InnerProfile);

export default Profile;
