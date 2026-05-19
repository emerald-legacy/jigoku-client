import React, { useState } from "react";
import { connect } from "react-redux";

import AlertPanel from "./SiteComponents/AlertPanel";
import * as actions from "./actions";
import type { RootState } from "./types/redux";
import { getLobbySocket } from "./socket";

interface InnerPasswordGameProps {
    cancelPasswordJoin: () => any;
    passwordError?: string;
    passwordGame?: { id: string; name: string };
    passwordJoinType?: string;
}

export function InnerPasswordGame({ cancelPasswordJoin, passwordError, passwordGame, passwordJoinType }: InnerPasswordGameProps) {
    const [password, setPassword] = useState("");

    const onJoinClick = (event: React.MouseEvent) => {
        event.preventDefault();

        const socket = getLobbySocket();
        if(passwordJoinType === "Join") {
            socket?.emit("joingame", passwordGame?.id, password);
        } else if(passwordJoinType === "Watch") {
            socket?.emit("watchgame", passwordGame?.id, password);
        }
    };

    const onCancelClick = (event: React.MouseEvent) => {
        event.preventDefault();
        cancelPasswordJoin();
    };

    const onPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    if(!passwordGame) {
        return null;
    }

    return (
        <div>
            <div className="col-sm-12">
                <h3>Enter the password for { passwordGame.name }</h3>
            </div>
            <div className="col-sm-5 game-password">
                <input className="form-control" type="password" onChange={ onPasswordChange } value={ password } />
            </div>
            <div className="row" />
            { passwordError ? (
                <div className="col-sm-6">
                    <AlertPanel type="error" message={ passwordError } />
                </div>
            ) : null }
            <div className="col-sm-12">
                <div className="btn-group">
                    <button className="btn btn-primary" onClick={ onJoinClick }>{ passwordJoinType }</button>
                    <button className="btn btn-primary" onClick={ onCancelClick }>Cancel</button>
                </div>
            </div>
        </div>
    );
}

InnerPasswordGame.displayName = "PasswordGame";

function mapStateToProps(state: RootState) {
    return {
        passwordError: state.games.passwordError,
        passwordGame: state.games.passwordGame,
        passwordJoinType: state.games.passwordJoinType
    };
}

const PasswordGame: React.ComponentType = connect(mapStateToProps, actions)(InnerPasswordGame);

export default PasswordGame;
