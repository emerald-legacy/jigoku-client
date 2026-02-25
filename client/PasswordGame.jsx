import { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import * as actions from './actions';

export function InnerPasswordGame({ cancelPasswordJoin, passwordError, passwordGame, passwordJoinType, socket }) {
    const [password, setPassword] = useState('');

    const onJoinClick = (event) => {
        event.preventDefault();

        if(passwordJoinType === 'Join') {
            socket.emit('joingame', passwordGame.id, password);
        } else if(passwordJoinType === 'Watch') {
            socket.emit('watchgame', passwordGame.id, password);
        }
    };

    const onCancelClick = (event) => {
        event.preventDefault();
        cancelPasswordJoin();
    };

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    if(!passwordGame) {
        return null;
    }

    return (
        <div>
            <div className='col-sm-12'>
                <h3>Enter the password for { passwordGame.name }</h3>
            </div>
            <div className='col-sm-5 game-password'>
                <input className='form-control' type='password' onChange={ onPasswordChange } value={ password } />
            </div>
            <div className='row' />
            { passwordError ? (
                <div className='col-sm-6'>
                    <AlertPanel type='error' message={ passwordError } />
                </div>
            ) : null }
            <div className='col-sm-12'>
                <div className='btn-group'>
                    <button className='btn btn-primary' onClick={ onJoinClick }>{ passwordJoinType }</button>
                    <button className='btn btn-primary' onClick={ onCancelClick }>Cancel</button>
                </div>
            </div>
        </div>
    );
}

InnerPasswordGame.displayName = 'PasswordGame';
InnerPasswordGame.propTypes = {
    cancelPasswordJoin: PropTypes.func,
    passwordError: PropTypes.string,
    passwordGame: PropTypes.object,
    passwordJoinType: PropTypes.string,
    socket: PropTypes.object
};

function mapStateToProps(state) {
    return {
        passwordError: state.games.passwordError,
        passwordGame: state.games.passwordGame,
        passwordJoinType: state.games.passwordJoinType,
        socket: state.socket.socket
    };
}

const PasswordGame = connect(mapStateToProps, actions)(InnerPasswordGame);

export default PasswordGame;
