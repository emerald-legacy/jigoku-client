import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import Checkbox from '../FormComponents/Checkbox.jsx';

const windows = [
    { name: 'dynasty', label: 'Dynasty phase', style: 'col-sm-4' },
    { name: 'draw', label: 'Draw phase', style: 'col-sm-4' },
    { name: 'preConflict', label: 'Conflict phase', style: 'col-sm-4' },
    { name: 'conflict', label: 'During conflict', style: 'col-sm-4' },
    { name: 'fate', label: 'Fate phase', style: 'col-sm-4' }
];

function GameConfiguration({ actionWindows, onOptionSettingToggle, onTimerSettingToggle, onToggle, optionSettings, timerSettings }) {
    const [windowTimer, setWindowTimer] = useState(timerSettings.windowTimer);

    const handleToggle = useCallback((option, value) => {
        if (onToggle) {
            onToggle(option, !value);
        }
    }, [onToggle]);

    const handleSlideStop = useCallback((event) => {
        let value = parseInt(event.target.value);

        if (Number.isNaN(value)) {
            return;
        }

        if (value < 0) {
            value = 0;
        }

        if (value > 10) {
            value = 10;
        }

        setWindowTimer(value);
    }, []);

    const handleTimerSettingToggle = useCallback((option, event) => {
        if (onTimerSettingToggle) {
            onTimerSettingToggle(option, event.target.checked);
        }
    }, [onTimerSettingToggle]);

    const handleOptionSettingToggle = useCallback((option, event) => {
        if (onOptionSettingToggle) {
            onOptionSettingToggle(option, event.target.checked);
        }
    }, [onOptionSettingToggle]);

    const windowsElements = windows.map((window) => (
        <Checkbox
            key={window.name}
            noGroup
            name={'promptedActionWindows.' + window.name}
            label={window.label}
            fieldClass={window.style}
            type='checkbox'
            onChange={() => handleToggle(window.name, actionWindows[window.name])}
            checked={actionWindows[window.name]}
        />
    ));

    return (
        <div>
            <form className='form form-horizontal'>
                <div className='panel-title'>
                    Action window defaults
                </div>
                <div className='panel'>
                    <div className='form-group'>
                        {windowsElements}
                    </div>
                </div>
                <div className='panel-title text-center'>
                    Timed Interrupt Window
                </div>
                <div className='panel'>
                    <div className='form-group'>
                        <Checkbox
                            name='timerSettings.events'
                            noGroup
                            label="Show timer for opponent's events"
                            fieldClass='col-sm-6'
                            onChange={(e) => handleTimerSettingToggle('events', e)}
                            checked={timerSettings.events}
                        />
                        <Checkbox
                            name='timerSettings.eventsInDeck'
                            noGroup
                            label='Show timer for events in your deck'
                            fieldClass='col-sm-6'
                            onChange={(e) => handleTimerSettingToggle('eventsInDeck', e)}
                            checked={timerSettings.eventsInDeck}
                        />
                    </div>
                </div>
                <div className='panel-title text-center'>
                    Options
                </div>
                <div className='panel'>
                    <div className='form-group'>
                        <Checkbox
                            name='optionSettings.markCardsUnselectable'
                            noGroup
                            label='Grey out cards with no relevant abilities during interrupt/reaction windows'
                            fieldClass='col-sm-6'
                            onChange={(e) => handleOptionSettingToggle('markCardsUnselectable', e)}
                            checked={optionSettings.markCardsUnselectable}
                        />
                        <Checkbox
                            name='optionSettings.cancelOwnAbilities'
                            noGroup
                            label='Prompt to cancel/react to initiation of my own abilities'
                            fieldClass='col-sm-6'
                            onChange={(e) => handleOptionSettingToggle('cancelOwnAbilities', e)}
                            checked={optionSettings.cancelOwnAbilities}
                        />
                        <Checkbox
                            name='optionSettings.orderForcedAbilities'
                            noGroup
                            label='Prompt to order forced triggered/simultaneous abilities'
                            fieldClass='col-sm-6'
                            onChange={(e) => handleOptionSettingToggle('orderForcedAbilities', e)}
                            checked={optionSettings.orderForcedAbilities}
                        />
                        <Checkbox
                            name='optionSettings.confirmOneClick'
                            noGroup
                            label='Show a confirmation prompt when initating 1-click abilities'
                            fieldClass='col-sm-6'
                            onChange={(e) => handleOptionSettingToggle('confirmOneClick', e)}
                            checked={optionSettings.confirmOneClick}
                        />
                        <Checkbox
                            name='optionSettings.disableCardStats'
                            noGroup
                            label='Disable card hover statistics popup'
                            fieldClass='col-sm-6'
                            onChange={(e) => handleOptionSettingToggle('disableCardStats', e)}
                            checked={optionSettings.disableCardStats}
                        />
                        <Checkbox
                            name='optionSettings.sortHandByName'
                            noGroup
                            label='Sort Hand by Name'
                            fieldClass='col-sm-6'
                            onChange={(e) => handleOptionSettingToggle('sortHandByName', e)}
                            checked={optionSettings.sortHandByName}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}

GameConfiguration.displayName = 'GameConfiguration';
GameConfiguration.propTypes = {
    actionWindows: PropTypes.object,
    onOptionSettingToggle: PropTypes.func,
    onTimerSettingToggle: PropTypes.func,
    onToggle: PropTypes.func,
    optionSettings: PropTypes.object,
    timerSettings: PropTypes.object
};

export default GameConfiguration;
