import { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import Input from './FormComponents/Input.jsx';
import Checkbox from './FormComponents/Checkbox.jsx';

import * as actions from './actions';

const windows = [
    { name: 'dynasty', label: 'Dynasty phase', style: 'col-sm-4' },
    { name: 'draw', label: 'Draw phase', style: 'col-sm-4' },
    { name: 'preConflict', label: 'Conflict phase', style: 'col-sm-4' },
    { name: 'conflict', label: 'During conflict', style: 'col-sm-4' },
    { name: 'fate', label: 'Fate phase', style: 'col-sm-4' }
];

export function InnerProfile({ refreshUser, socket, user }) {
    const [disableGravatar, setDisableGravatar] = useState(user?.settings?.disableGravatar || false);
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordAgain, setNewPasswordAgain] = useState('');
    const [promptedActionWindows, setPromptedActionWindows] = useState(user?.promptedActionWindows || {});
    const [validation, setValidation] = useState({});
    const [windowTimer, setWindowTimer] = useState(user?.settings?.windowTimer || 0);
    const [optionSettings, setOptionSettings] = useState(user?.settings?.optionSettings || {});
    const [timerSettings, setTimerSettings] = useState(user?.settings?.timerSettings || {});
    const [selectedBackground, setSelectedBackground] = useState(user?.settings?.background || 'none');
    const [selectedCardSize, setSelectedCardSize] = useState(user?.settings?.cardSize || 'normal');
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [successMessage, setSuccessMessage] = useState(undefined);

    useEffect(() => {
        if(user) {
            setEmail(user.email);
            setDisableGravatar(user.settings?.disableGravatar || false);
            setPromptedActionWindows(user.promptedActionWindows || {});
        }
    }, [user]);

    const handleChange = useCallback((field, event) => {
        const value = event.target.value;
        switch(field) {
            case 'email':
                setEmail(value);
                break;
            case 'newPassword':
                setNewPassword(value);
                break;
            case 'newPasswordAgain':
                setNewPasswordAgain(value);
                break;
        }
    }, []);

    const handleWindowToggle = useCallback((field, event) => {
        setPromptedActionWindows(prev => ({
            ...prev,
            [field]: event.target.checked
        }));
    }, []);

    const handleTimerSettingToggle = useCallback((field, event) => {
        setTimerSettings(prev => ({
            ...prev,
            [field]: event.target.checked
        }));
    }, []);

    const handleOptionSettingToggle = useCallback((field, event) => {
        setOptionSettings(prev => ({
            ...prev,
            [field]: event.target.checked
        }));
    }, []);

    const verifyPassword = useCallback((isSubmitting) => {
        const newValidation = { ...validation };
        delete newValidation.password;

        if(!newPassword && !newPasswordAgain) {
            setValidation(newValidation);
            return;
        }

        if(newPassword.length < 6) {
            newValidation.password = 'The password you specify must be at least 6 characters long';
        }

        if(isSubmitting && !newPasswordAgain) {
            newValidation.password = 'Please enter your password again';
        }

        if(newPassword && newPasswordAgain && newPassword !== newPasswordAgain) {
            newValidation.password = 'The passwords you have specified do not match';
        }

        setValidation(newValidation);
    }, [newPassword, newPasswordAgain, validation]);

    const verifyEmail = useCallback(() => {
        const newValidation = { ...validation };
        delete newValidation.email;

        if(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
            newValidation.email = 'Please enter a valid email address';
        }

        setValidation(newValidation);
    }, [email, validation]);

    const handleSaveClick = useCallback(async (event) => {
        event.preventDefault();

        setErrorMessage(undefined);
        setSuccessMessage(undefined);

        verifyEmail();
        verifyPassword(true);

        // Check if there are any validation errors
        const hasValidationErrors = Object.values(validation).some(message => message && message !== '');
        if(hasValidationErrors) {
            setErrorMessage('There was an error in one or more fields, please see below, correct the error and try again');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put(`/api/account/${user.username}`, {
                data: JSON.stringify({
                    email: email,
                    password: newPassword,
                    promptedActionWindows: promptedActionWindows,
                    settings: {
                        disableGravatar: disableGravatar,
                        windowTimer: windowTimer,
                        optionSettings: optionSettings,
                        timerSettings: timerSettings,
                        background: selectedBackground,
                        cardSize: selectedCardSize
                    }
                })
            });

            const data = response.data;

            if(data.success) {
                setSuccessMessage('Profile saved successfully.  Please note settings changed here will only apply at the start of your next game');
                socket.emit('authenticate', data.token);
                refreshUser(data.user, data.token);
            } else {
                setErrorMessage(data.message);
            }
        } catch(error) {
            setErrorMessage(error.response?.data?.message || 'An error occurred while saving your profile');
        } finally {
            setLoading(false);
        }
    }, [user, email, newPassword, promptedActionWindows, disableGravatar, windowTimer, optionSettings, timerSettings, selectedBackground, selectedCardSize, validation, verifyEmail, verifyPassword, socket, refreshUser]);

    const handleSlideStop = useCallback((event) => {
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

        setWindowTimer(value);
    }, []);

    const handleBackgroundClick = useCallback((background) => {
        setSelectedBackground(background);
    }, []);

    const handleCardClick = useCallback((size) => {
        setSelectedCardSize(size);
    }, []);

    const windowsElements = useMemo(() => {
        return windows.map(window => (
            <Checkbox
                key={ window.name }
                noGroup
                name={ 'promptedActionWindows.' + window.name }
                label={ window.label }
                fieldClass={ window.style }
                type='checkbox'
                onChange={ (e) => handleWindowToggle(window.name, e) }
                checked={ promptedActionWindows[window.name] }
            />
        ));
    }, [promptedActionWindows, handleWindowToggle]);

    if(!user) {
        return <AlertPanel type='error' message='You must be logged in to update your profile' />;
    }

    return (
        <div className="row profile full-height">
            <div className="col-sm-8 col-sm-offset-2 about-container">
                { errorMessage ? <AlertPanel type='error' message={ errorMessage } /> : null }
                { successMessage ? <AlertPanel type='success' message={ successMessage } /> : null }
                <form className="form form-horizontal">
                    <div className="panel-title">
                        Profile
                    </div>
                    <div className="panel">
                        <Input name='email' label='Email Address' labelClass='col-sm-4' fieldClass='col-sm-8' placeholder='Enter email address'
                            type='text' onChange={ (e) => handleChange('email', e) } value={ email }
                            onBlur={ verifyEmail } validationMessage={ validation.email } />
                        <Input name='newPassword' label='New Password' labelClass='col-sm-4' fieldClass='col-sm-8' placeholder='Enter new password'
                            type='password' onChange={ (e) => handleChange('newPassword', e) } value={ newPassword }
                            onBlur={ () => verifyPassword(false) } validationMessage={ validation.password } />
                        <Input name='newPasswordAgain' label='New Password (again)' labelClass='col-sm-4' fieldClass='col-sm-8' placeholder='Enter new password (again)'
                            type='password' onChange={ (e) => handleChange('newPasswordAgain', e) } value={ newPasswordAgain }
                            onBlur={ () => verifyPassword(false) } validationMessage={ validation.password1 } />
                        <Checkbox name='disableGravatar' label='Disable Gravatar integration' fieldClass='col-sm-offset-4 col-sm-8'
                            onChange={ (e) => setDisableGravatar(e.target.checked) } checked={ disableGravatar } />
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
                                    <input type='range'
                                        className="form-control"
                                        value={ windowTimer }
                                        onChange={ handleSlideStop }
                                        step={ 1 }
                                        max={ 10 }
                                        min={ 0 } />
                                </div>
                                <div className="col-sm-2">
                                    <input className="form-control text-center" name='timer' value={ windowTimer } onChange={ handleSlideStop } />
                                </div>
                                <label className="col-sm-1 control-label">seconds</label>

                                <Checkbox name='timerSettings.events' noGroup label="Show timer for opponent's events" fieldClass='col-sm-6'
                                    onChange={ (e) => handleTimerSettingToggle('events', e) } checked={ timerSettings.events } />
                                <Checkbox name='timerSettings.abilities' noGroup label='Show timer for events in my deck' fieldClass='col-sm-6'
                                    onChange={ (e) => handleTimerSettingToggle('eventsInDeck', e) } checked={ timerSettings.eventsInDeck } />
                            </div>
                        </div>
                        <div className="panel-title">
                            Options
                        </div>
                        <div className="panel">
                            <div className="form-group">
                                <Checkbox
                                    name='optionSettings.markCardsUnselectable'
                                    noGroup
                                    label='Grey out cards with no relevant abilities during interrupt/reaction windows'
                                    fieldClass='col-sm-6'
                                    onChange={ (e) => handleOptionSettingToggle('markCardsUnselectable', e) }
                                    checked={ optionSettings.markCardsUnselectable }
                                />
                                <Checkbox
                                    name='optionSettings.cancelOwnAbilities'
                                    noGroup
                                    label='Prompt to cancel/react to initiation of my own abilities'
                                    fieldClass='col-sm-6'
                                    onChange={ (e) => handleOptionSettingToggle('cancelOwnAbilities', e) }
                                    checked={ optionSettings.cancelOwnAbilities } />
                                <Checkbox
                                    name='optionSettings.orderForcedAbilities'
                                    noGroup
                                    label='Prompt to order forced triggered/simultaneous abilities'
                                    fieldClass='col-sm-6'
                                    onChange={ (e) => handleOptionSettingToggle('orderForcedAbilities', e) }
                                    checked={ optionSettings.orderForcedAbilities }
                                />
                                <Checkbox
                                    name='optionSettings.confirmOneClick'
                                    noGroup
                                    label='Show a confirmation prompt when initating 1-click abilities'
                                    fieldClass='col-sm-6'
                                    onChange={ (e) => handleOptionSettingToggle('confirmOneClick', e) }
                                    checked={ optionSettings.confirmOneClick }
                                />
                                <Checkbox
                                    name='optionSettings.disableCardStats'
                                    noGroup
                                    label='Disable card hover statistics popup'
                                    fieldClass='col-sm-6'
                                    onChange={ (e) => handleOptionSettingToggle('disableCardStats', e) }
                                    checked={ optionSettings.disableCardStats }
                                />
                                <Checkbox
                                    name='optionSettings.sortHandByName'
                                    noGroup
                                    label='Sort Hand by Name'
                                    fieldClass='col-sm-6'
                                    onChange={ (e) => handleOptionSettingToggle('sortHandByName', e) }
                                    checked={ optionSettings.sortHandByName }
                                />
                                <Checkbox
                                    name='optionSettings.showRingEffects'
                                    noGroup
                                    label='Show ring effect descriptions on hover'
                                    fieldClass='col-sm-6'
                                    onChange={ (e) => handleOptionSettingToggle('showRingEffects', e) }
                                    checked={ optionSettings.showRingEffects }
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
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('none') }>
                                    <img className={ `img-responsive${selectedBackground === 'none' ? ' selected' : ''}` }
                                        src='img/blank.png' />
                                    <span className="bg-label">None</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('CRAB') }>
                                    <img className={ `img-responsive${selectedBackground === 'CRAB' ? ' selected' : ''}` }
                                        src='/img/bgs/crab.jpg' />
                                    <span className="bg-label">Crab</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('CRAB2') }>
                                    <img className={ `img-responsive${selectedBackground === 'CRAB2' ? ' selected' : ''}` }
                                        src='/img/bgs/crab2.jpg' />
                                    <span className="bg-label">Crab 2</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('CRAB3') }>
                                    <img className={ `img-responsive${selectedBackground === 'CRAB3' ? ' selected' : ''}` }
                                        src='/img/bgs/crab3.jpg' />
                                    <span className="bg-label">Crab 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('CRANE') }>
                                    <img className={ `img-responsive${selectedBackground === 'CRANE' ? ' selected' : ''}` }
                                        src='/img/bgs/crane.jpg' />
                                    <span className="bg-label">Crane</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('CRANE2') }>
                                    <img className={ `img-responsive${selectedBackground === 'CRANE2' ? ' selected' : ''}` }
                                        src='/img/bgs/crane2.jpg' />
                                    <span className="bg-label">Crane 2</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('CRANE3') }>
                                    <img className={ `img-responsive${selectedBackground === 'CRANE3' ? ' selected' : ''}` }
                                        src='/img/bgs/crane3.jpg' />
                                    <span className="bg-label">Crane 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('CRANE4') }>
                                    <img className={ `img-responsive${selectedBackground === 'CRANE4' ? ' selected' : ''}` }
                                        src='/img/bgs/crane4.jpg' />
                                    <span className="bg-label">Crane 4</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('DRAGON') }>
                                    <img className={ `img-responsive${selectedBackground === 'DRAGON' ? ' selected' : ''}` }
                                        src='/img/bgs/dragon.jpg' />
                                    <span className="bg-label">Dragon</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('DRAGON2') }>
                                    <img className={ `img-responsive${selectedBackground === 'DRAGON2' ? ' selected' : ''}` }
                                        src='/img/bgs/dragon2.jpg' />
                                    <span className="bg-label">Dragon 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('DRAGON3') }>
                                    <img className={ `img-responsive${selectedBackground === 'DRAGON3' ? ' selected' : ''}` }
                                        src='/img/bgs/dragon3.jpg' />
                                    <span className="bg-label">Dragon 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('LION') }>
                                    <img className={ `img-responsive${selectedBackground === 'LION' ? ' selected' : ''}` }
                                        src='/img/bgs/lion.jpg' />
                                    <span className="bg-label">Lion</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('LION2') }>
                                    <img className={ `img-responsive${selectedBackground === 'LION2' ? ' selected' : ''}` }
                                        src='/img/bgs/lion2.jpg' />
                                    <span className="bg-label">Lion 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('LION3') }>
                                    <img className={ `img-responsive${selectedBackground === 'LION3' ? ' selected' : ''}` }
                                        src='/img/bgs/lion3.jpg' />
                                    <span className="bg-label">Lion 3</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('OTTER') }>
                                    <img className={ `img-responsive${selectedBackground === 'OTTER' ? ' selected' : ''}` }
                                        src='/img/bgs/otter.jpg' />
                                    <span className="bg-label">Otter</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('PHOENIX') }>
                                    <img className={ `img-responsive${selectedBackground === 'PHOENIX' ? ' selected' : ''}` }
                                        src='/img/bgs/phoenix.jpg' />
                                    <span className="bg-label">Phoenix</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('PHOENIX2') }>
                                    <img className={ `img-responsive${selectedBackground === 'PHOENIX2' ? ' selected' : ''}` }
                                        src='/img/bgs/phoenix2.jpg' />
                                    <span className="bg-label">Phoenix 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('PHOENIX3') }>
                                    <img className={ `img-responsive${selectedBackground === 'PHOENIX3' ? ' selected' : ''}` }
                                        src='/img/bgs/phoenix3.jpg' />
                                    <span className="bg-label">Phoenix 3</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('SCORPION') }>
                                    <img className={ `img-responsive${selectedBackground === 'SCORPION' ? ' selected' : ''}` }
                                        src='/img/bgs/scorpion.jpg' />
                                    <span className="bg-label">Scorpion</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('SCORPION2') }>
                                    <img className={ `img-responsive${selectedBackground === 'SCORPION2' ? ' selected' : ''}` }
                                        src='/img/bgs/scorpion2.jpg' />
                                    <span className="bg-label">Scorpion 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('SCORPION3') }>
                                    <img className={ `img-responsive${selectedBackground === 'SCORPION3' ? ' selected' : ''}` }
                                        src='/img/bgs/scorpion3.jpg' />
                                    <span className="bg-label">Scorpion 3</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('UNICORN') }>
                                    <img className={ `img-responsive${selectedBackground === 'UNICORN' ? ' selected' : ''}` }
                                        src='/img/bgs/unicorn.jpg' />
                                    <span className="bg-label">Unicorn</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('UNICORN2') }>
                                    <img className={ `img-responsive${selectedBackground === 'UNICORN2' ? ' selected' : ''}` }
                                        src='/img/bgs/unicorn2.jpg' />
                                    <span className="bg-label">Unicorn 2</span>
                                </div>
                                <div className="col-sm-4" onClick={ () => handleBackgroundClick('UNICORN3') }>
                                    <img className={ `img-responsive${selectedBackground === 'UNICORN3' ? ' selected' : ''}` }
                                        src='/img/bgs/unicorn3.jpg' />
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
                                    <div className="card-settings" onClick={ () => handleCardClick('small') }>
                                        <div className={ `card small vertical${selectedCardSize === 'small' ? ' selected' : ''}` }>
                                            <img className="card small vertical"
                                                src='img/cards/dynastycardback.png' />
                                        </div>
                                        <span className="bg-label">Small</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => handleCardClick('normal') }>
                                        <div className={ `card vertical${selectedCardSize === 'normal' ? ' selected' : ''}` }>
                                            <img className="card vertical"
                                                src='img/cards/dynastycardback.png' />
                                        </div>
                                        <span className="bg-label">Normal</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => handleCardClick('large') }>
                                        <div className={ `card vertical large${selectedCardSize === 'large' ? ' selected' : ''}` }>
                                            <img className="card-image large vertical"
                                                src='/img/cards/dynastycardback.png' />
                                        </div>
                                        <span className="bg-label">Large</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => handleCardClick('x-large') }>
                                        <div className={ `card vertical x-large${selectedCardSize === 'x-large' ? ' selected' : ''}` }>
                                            <img className="card-image x-large vertical"
                                                src='img/cards/dynastycardback.png' />
                                        </div>
                                        <span className="bg-label">Extra-Large</span>
                                    </div>
                                    <div className="card-settings" onClick={ () => handleCardClick('xxl') }>
                                        <div className={ `card vertical xxl${selectedCardSize === 'xxl' ? ' selected' : ''}` }>
                                            <img className="card-image xxl vertical"
                                                src='img/cards/dynastycardback.png' />
                                        </div>
                                        <span className="bg-label">XXL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-offset-10 col-sm-2">
                        <button className="btn btn-primary" type='button' disabled={ loading } onClick={ handleSaveClick }>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

InnerProfile.displayName = 'Profile';
InnerProfile.propTypes = {
    refreshUser: PropTypes.func,
    socket: PropTypes.object,
    user: PropTypes.object
};

function mapStateToProps(state) {
    return {
        socket: state.socket.socket,
        user: state.auth.user
    };
}

const Profile = connect(mapStateToProps, actions)(InnerProfile);

export default Profile;
