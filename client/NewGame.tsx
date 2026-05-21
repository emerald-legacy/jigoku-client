import React, { useState, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import GameModes from "../shared/GameModes";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";
import { getLobbySocket } from "./socket";

const defaultTime: Record<string, string> = {
    timer: "60",
    chess: "40",
    hourglass: "15",
    byoyomi: "0"
};

interface InnerNewGameProps {
    cancelNewGame: () => void;
    connected?: boolean;
    defaultGameName?: string;
    loadDecks: (gameMode: string) => void;
}

export function InnerNewGame({ cancelNewGame, connected, defaultGameName, loadDecks }: InnerNewGameProps) {
    const [spectators, setSpectators] = useState(true);
    const [spectatorSquelch, setSpectatorSquelch] = useState(false);
    const [selectedGameMode, setSelectedGameMode] = useState<string>(GameModes.Emerald);
    const [clocks, setClocks] = useState(false);
    const [selectedClockType, setSelectedClockType] = useState("timer");
    const [clockTimer, setClockTimer] = useState<number | string>(60);
    const [byoyomiPeriods, setByoyomiPeriods] = useState<number | string>(5);
    const [byoyomiTimePeriod, setByoyomiTimePeriod] = useState<number | string>(30);
    const [selectedGameType, setSelectedGameType] = useState("casual");
    const [password, setPassword] = useState("");
    const [gameName, setGameName] = useState(defaultGameName || "");

    const handleCancelClick = (event: React.MouseEvent) => {
        event.preventDefault();
        cancelNewGame();
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGameName(event.target.value.substr(0, 140));
    };

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleSpectatorsClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSpectators(event.target.checked);
    };

    const handleSpectatorSquelchClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSpectatorSquelch(event.target.checked);
    };

    const handleClockClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        setClocks(event.target.checked);
    };

    const handleSubmitClick = (event: React.MouseEvent) => {
        event.preventDefault();

        const clockConfig = {
            type: clocks ? selectedClockType : "none",
            time: clocks ? clockTimer : 0,
            periods: clocks ? byoyomiPeriods : 0,
            timePeriod: clocks ? byoyomiTimePeriod : 0
        };

        getLobbySocket()?.emit("newgame", {
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
    };

    const handleRadioChange = (gameType: string) => {
        setSelectedGameType(gameType);
    };

    const handleRulesRadioChange = (gameMode: string) => {
        setSelectedGameMode(gameMode);
    };

    const handleClockRadioChange = (clockType: string) => {
        setSelectedClockType(clockType);
        setClockTimer(defaultTime[clockType]);
    };

    const isGameTypeSelected = (gameType: string) => {
        return selectedGameType === gameType;
    };

    const isGameModeSelected = (gameMode: string) => {
        return selectedGameMode === gameMode;
    };

    const isClockTypeSelected = (clockType: string) => {
        return selectedClockType === clockType;
    };

    const getClockInput = () => {
        return (
            <div>
                <div className="row game-password">
                    <div className="col-sm-12">
                        <b>Clocks</b>
                    </div>
                    <div className="col-sm-10">
                        <label className="radio-inline">
                            <input type="radio" onChange={ () => handleClockRadioChange("timer") } checked={ isClockTypeSelected("timer") } />
                            Timer
                        </label>
                        <label className="radio-inline">
                            <input type="radio" onChange={ () => handleClockRadioChange("chess") } checked={ isClockTypeSelected("chess") } />
                            Chess
                        </label>
                        <label className="radio-inline">
                            <input type="radio" onChange={ () => handleClockRadioChange("hourglass") } checked={ isClockTypeSelected("hourglass") } />
                            Hourglass
                        </label>
                        <label className="radio-inline">
                            <input type="radio" onChange={ () => handleClockRadioChange("byoyomi") } checked={ isClockTypeSelected("byoyomi") } />
                            Byoyomi
                        </label>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-8">
                        <label>Main Time (Minutes)</label>
                        <input className="form-control" value={ clockTimer } onChange={ (event) => setClockTimer(event.target.value.replace(/\D/, "")) } />
                    </div>
                </div>
                { selectedClockType === "byoyomi" && (
                    <div className="row">
                        <div className="col-sm-8">
                            <label>Number of Byoyomi Periods</label>
                            <input className="form-control" value={ byoyomiPeriods } onChange={ (event) => setByoyomiPeriods(event.target.value.replace(/\D/, "")) } />
                            <label>Byoyomi Time Period (Seconds)</label>
                            <input className="form-control" value={ byoyomiTimePeriod } onChange={ (event) => setByoyomiTimePeriod(event.target.value.replace(/\D/, "")) } />
                        </div>
                    </div>
                ) }
            </div>
        );
    };

    const charsLeft = 140 - gameName.length;

    if(!connected) {
        return (
            <div>
                Connecting to the server, please wait...
            </div>
        );
    }

    return (
        <div>
            <div className="panel-title text-center">
                New game
            </div>
            <div className="panel">
                <form className="form">
                    <div className="row">
                        <div className="col-sm-8">
                            <label htmlFor="gameName">Name</label>
                            <label className="game-name-char-limit">{ charsLeft >= 0 ? charsLeft : 0 }</label>
                            <input className="form-control" placeholder="Game Name" type="text" onChange={ handleNameChange } value={ gameName } />
                        </div>
                    </div>
                    <div className="row">
                        <div className="checkbox col-sm-8">
                            <label>
                                <input type="checkbox" onChange={ handleSpectatorsClick } checked={ spectators } />
                                Allow spectators
                            </label>
                        </div>
                        <div className="checkbox col-sm-8">
                            <label>
                                <input type="checkbox" onChange={ handleSpectatorSquelchClick } checked={ spectatorSquelch } />
                                Don't allow spectators to chat
                            </label>
                        </div>
                        <div className="checkbox col-sm-8">
                            <label>
                                <input type="checkbox" onChange={ handleClockClick } checked={ clocks } />
                                Timed game
                            </label>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-12">
                            <b>Format</b>
                        </div>
                        <div className="col-sm-10">
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRulesRadioChange(GameModes.Emerald) } checked={ isGameModeSelected(GameModes.Emerald) } />
                                Emerald
                            </label>
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRulesRadioChange(GameModes.Sanctuary) } checked={ isGameModeSelected(GameModes.Sanctuary) } />
                                Sanctuary
                            </label>
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRulesRadioChange(GameModes.Stronghold) } checked={ isGameModeSelected(GameModes.Stronghold) } />
                                Stronghold
                            </label>
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRulesRadioChange(GameModes.Skirmish) } checked={ isGameModeSelected(GameModes.Skirmish) } />
                                Skirmish
                            </label>
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRulesRadioChange(GameModes.Obsidian) } checked={ isGameModeSelected(GameModes.Obsidian) } />
                                Obsidian
                            </label>
                        </div>
                    </div>
                    <div className="row game-password">
                        <div className="col-sm-12">
                            <b>Game Type</b>
                        </div>
                        <div className="col-sm-10">
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRadioChange("beginner") } checked={ isGameTypeSelected("beginner") } />
                                Beginner
                            </label>
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRadioChange("casual") } checked={ isGameTypeSelected("casual") } />
                                Casual
                            </label>
                            <label className="radio-inline">
                                <input type="radio" onChange={ () => handleRadioChange("competitive") } checked={ isGameTypeSelected("competitive") } />
                                Competitive
                            </label>
                        </div>
                    </div>
                    { clocks ? getClockInput() : null }
                    <div className="row game-password">
                        <div className="col-sm-8">
                            <label>Password</label>
                            <input className="form-control" type="password" onChange={ handlePasswordChange } value={ password } />
                        </div>
                    </div>
                    <div className="button-row">
                        <button className="btn btn-primary" onClick={ handleSubmitClick }>Submit</button>
                        <button className="btn btn-primary" onClick={ handleCancelClick }>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

InnerNewGame.displayName = "NewGame";

function mapStateToProps(state: RootState) {
    return {
        allowMelee: state.auth.user ? state.auth.user.permissions.allowMelee : false,
        connected: state.socket.connected
    };
}

interface NewGameOwnProps {
    defaultGameName?: string;
}

export default function NewGame(ownProps: NewGameOwnProps) {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    return <InnerNewGame { ...props } { ...boundActions } { ...ownProps } />;
}
