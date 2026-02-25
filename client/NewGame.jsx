import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GameModes from './GameModes';

import * as actions from './actions';

const defaultTime = {
    timer: '60',
    chess: '40',
    hourglass: '15',
    byoyomi: '0'
};

export function InnerNewGame({ cancelNewGame, defaultGameName, loadDecks, socket }) {
    const [spectators, setSpectators] = useState(true);
    const [spectatorSquelch, setSpectatorSquelch] = useState(false);
    const [selectedGameMode, setSelectedGameMode] = useState(GameModes.Emerald);
    const [clocks, setClocks] = useState(false);
    const [selectedClockType, setSelectedClockType] = useState('timer');
    const [clockTimer, setClockTimer] = useState(60);
    const [byoyomiPeriods, setByoyomiPeriods] = useState(5);
    const [byoyomiTimePeriod, setByoyomiTimePeriod] = useState(30);
    const [selectedGameType, setSelectedGameType] = useState('casual');
    const [password, setPassword] = useState('');
    const [gameName, setGameName] = useState(defaultGameName || '');

    const handleCancelClick = useCallback((event) => {
        event.preventDefault();
        cancelNewGame();
    }, [cancelNewGame]);

    const handleNameChange = useCallback((event) => {
        setGameName(event.target.value.substr(0, 140));
    }, []);

    const handlePasswordChange = useCallback((event) => {
        setPassword(event.target.value);
    }, []);

    const handleSpectatorsClick = useCallback((event) => {
        setSpectators(event.target.checked);
    }, []);

    const handleSpectatorSquelchClick = useCallback((event) => {
        setSpectatorSquelch(event.target.checked);
    }, []);

    const handleClockClick = useCallback((event) => {
        setClocks(event.target.checked);
    }, []);

    const handleSubmitClick = useCallback((event) => {
        event.preventDefault();

        const clockConfig = {
            type: clocks ? selectedClockType : 'none',
            time: clocks ? clockTimer : 0,
            periods: clocks ? byoyomiPeriods : 0,
            timePeriod: clocks ? byoyomiTimePeriod : 0
        };

        socket.emit('newgame', {
            name: gameName,
            spectators: spectators,
            spectatorSquelch: spectatorSquelch,
            gameType: selectedGameType,
            skirmishMode: selectedGameMode === GameModes.Skirmish, //TODO: Legacy support, remove in a bit
            gameMode: selectedGameMode,
            clocks: clockConfig,
            password: password
        });

        loadDecks(selectedGameMode);
    }, [socket, gameName, spectators, spectatorSquelch, selectedGameType, selectedGameMode, clocks, selectedClockType, clockTimer, byoyomiPeriods, byoyomiTimePeriod, password, loadDecks]);

    const handleRadioChange = useCallback((gameType) => {
        setSelectedGameType(gameType);
    }, []);

    const handleRulesRadioChange = useCallback((gameMode) => {
        setSelectedGameMode(gameMode);
    }, []);

    const handleClockRadioChange = useCallback((clockType) => {
        setSelectedClockType(clockType);
        setClockTimer(defaultTime[clockType]);
    }, []);

    const isGameTypeSelected = useCallback((gameType) => {
        return selectedGameType === gameType;
    }, [selectedGameType]);

    const isGameModeSelected = useCallback((gameMode) => {
        return selectedGameMode === gameMode;
    }, [selectedGameMode]);

    const isClockTypeSelected = useCallback((clockType) => {
        return selectedClockType === clockType;
    }, [selectedClockType]);

    const getClockInput = () => {
        return (
            <div>
                <div className='row game-password'>
                    <div className='col-sm-12'>
                        <b>Clocks</b>
                    </div>
                    <div className='col-sm-10'>
                        <label className='radio-inline'>
                            <input type='radio' onChange={ () => handleClockRadioChange('timer') } checked={ isClockTypeSelected('timer') } />
                            Timer
                        </label>
                        <label className='radio-inline'>
                            <input type='radio' onChange={ () => handleClockRadioChange('chess') } checked={ isClockTypeSelected('chess') } />
                            Chess
                        </label>
                        <label className='radio-inline'>
                            <input type='radio' onChange={ () => handleClockRadioChange('hourglass') } checked={ isClockTypeSelected('hourglass') } />
                            Hourglass
                        </label>
                        <label className='radio-inline'>
                            <input type='radio' onChange={ () => handleClockRadioChange('byoyomi') } checked={ isClockTypeSelected('byoyomi') } />
                            Byoyomi
                        </label>
                    </div>
                </div>
                <div className='row'>
                    <div className='col-sm-8'>
                        <label>Main Time (Minutes)</label>
                        <input className='form-control' value={ clockTimer } onChange={ (event) => setClockTimer(event.target.value.replace(/\D/, '')) } />
                    </div>
                </div>
                { selectedClockType === 'byoyomi' && (
                    <div className='row'>
                        <div className='col-sm-8'>
                            <label>Number of Byoyomi Periods</label>
                            <input className='form-control' value={ byoyomiPeriods } onChange={ (event) => setByoyomiPeriods(event.target.value.replace(/\D/, '')) } />
                            <label>Byoyomi Time Period (Seconds)</label>
                            <input className='form-control' value={ byoyomiTimePeriod } onChange={ (event) => setByoyomiTimePeriod(event.target.value.replace(/\D/, '')) } />
                        </div>
                    </div>
                ) }
            </div>
        );
    };

    const charsLeft = 140 - gameName.length;

    if(!socket) {
        return (
            <div>
                Connecting to the server, please wait...
            </div>
        );
    }

    return (
        <div>
            <div className='panel-title text-center'>
                New game
            </div>
            <div className='panel'>
                <form className='form'>
                    <div className='row'>
                        <div className='col-sm-8'>
                            <label htmlFor='gameName'>Name</label>
                            <label className='game-name-char-limit'>{ charsLeft >= 0 ? charsLeft : 0 }</label>
                            <input className='form-control' placeholder='Game Name' type='text' onChange={ handleNameChange } value={ gameName } />
                        </div>
                    </div>
                    <div className='row'>
                        <div className='checkbox col-sm-8'>
                            <label>
                                <input type='checkbox' onChange={ handleSpectatorsClick } checked={ spectators } />
                                Allow spectators
                            </label>
                        </div>
                        <div className='checkbox col-sm-8'>
                            <label>
                                <input type='checkbox' onChange={ handleSpectatorSquelchClick } checked={ spectatorSquelch } />
                                Don't allow spectators to chat
                            </label>
                        </div>
                        <div className='checkbox col-sm-8'>
                            <label>
                                <input type='checkbox' onChange={ handleClockClick } checked={ clocks } />
                                Timed game
                            </label>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='col-sm-12'>
                            <b>Format</b>
                        </div>
                        <div className='col-sm-10'>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRulesRadioChange(GameModes.Emerald) } checked={ isGameModeSelected(GameModes.Emerald) } />
                                Emerald
                            </label>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRulesRadioChange(GameModes.Sanctuary) } checked={ isGameModeSelected(GameModes.Sanctuary) } />
                                Sanctuary
                            </label>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRulesRadioChange(GameModes.Stronghold) } checked={ isGameModeSelected(GameModes.Stronghold) } />
                                Imperial
                            </label>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRulesRadioChange(GameModes.Skirmish) } checked={ isGameModeSelected(GameModes.Skirmish) } />
                                Skirmish
                            </label>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRulesRadioChange(GameModes.Obsidian) } checked={ isGameModeSelected(GameModes.Obsidian) } />
                                Obsidian
                            </label>
                        </div>
                    </div>
                    <div className='row game-password'>
                        <div className='col-sm-12'>
                            <b>Game Type</b>
                        </div>
                        <div className='col-sm-10'>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRadioChange('beginner') } checked={ isGameTypeSelected('beginner') } />
                                Beginner
                            </label>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRadioChange('casual') } checked={ isGameTypeSelected('casual') } />
                                Casual
                            </label>
                            <label className='radio-inline'>
                                <input type='radio' onChange={ () => handleRadioChange('competitive') } checked={ isGameTypeSelected('competitive') } />
                                Competitive
                            </label>
                        </div>
                    </div>
                    { clocks ? getClockInput() : null }
                    <div className='row game-password'>
                        <div className='col-sm-8'>
                            <label>Password</label>
                            <input className='form-control' type='password' onChange={ handlePasswordChange } value={ password } />
                        </div>
                    </div>
                    <div className='button-row'>
                        <button className='btn btn-primary' onClick={ handleSubmitClick }>Submit</button>
                        <button className='btn btn-primary' onClick={ handleCancelClick }>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

InnerNewGame.displayName = 'NewGame';
InnerNewGame.propTypes = {
    allowMelee: PropTypes.bool,
    cancelNewGame: PropTypes.func,
    defaultGameName: PropTypes.string,
    loadDecks: PropTypes.func,
    socket: PropTypes.object
};

function mapStateToProps(state) {
    return {
        allowMelee: state.auth.user ? state.auth.user.permissions.allowMelee : false,
        socket: state.socket.socket
    };
}

const NewGame = connect(mapStateToProps, actions)(InnerNewGame);

export default NewGame;
