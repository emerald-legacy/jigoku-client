import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';

import Link from './Link.jsx';
import AlertPanel from './SiteComponents/AlertPanel.jsx';

import * as actions from './actions';

export function InnerLogin({ login, navigate, socket }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [validation, setValidation] = useState({});
    const [error, setError] = useState('');

    const verifyUsername = useCallback(() => {
        const newValidation = { ...validation };
        delete newValidation['username'];

        if(!username || username === '') {
            newValidation['username'] = 'Please enter your username';
        }

        setValidation(newValidation);
        return newValidation;
    }, [username, validation]);

    const verifyPassword = useCallback(() => {
        const newValidation = { ...validation };
        delete newValidation['password'];

        if(!password || password === '') {
            newValidation['password'] = 'Please enter your password';
        }

        setValidation(newValidation);
        return newValidation;
    }, [password, validation]);

    const onLogin = useCallback(async (event) => {
        event.preventDefault();

        setError('');

        // Do synchronous validation to avoid stale state issues
        const newValidation = {};
        if(!username || username === '') {
            newValidation['username'] = 'Please enter your username';
        }
        if(!password || password === '') {
            newValidation['password'] = 'Please enter your password';
        }
        setValidation(newValidation);

        if(Object.values(newValidation).some((message) => message && message !== '')) {
            setError('Please complete both fields and try again');
            return;
        }

        try {
            const response = await axios.post('/api/account/login', {
                username: username,
                password: password
            });

            if(!response.data.success) {
                setError(response.data.message);
                return;
            }

            login(response.data.user, response.data.token);
            if(socket) {
                socket.emit('authenticate', response.data.token);
            }

            navigate('/');
        } catch(err) {
            if(err.response && err.response.status === 401) {
                setError('Invalid Username/password');
            } else {
                setError('Could not communicate with the server.  Please try again later.');
            }
        }
    }, [username, password, login, navigate, socket]);

    const fields = [
        {
            name: 'username',
            label: 'Username',
            placeholder: 'Username',
            inputType: 'text',
            value: username,
            onChange: setUsername,
            blurCallback: verifyUsername
        },
        {
            name: 'password',
            label: 'Password',
            placeholder: 'Password',
            inputType: 'password',
            value: password,
            onChange: setPassword,
            blurCallback: verifyPassword
        }
    ];

    const fieldsToRender = fields.map((field) => {
        let className = 'form-group';
        let validationMessage = null;

        if(validation[field.name]) {
            className += ' has-error';
            validationMessage = <span className='help-block'>{ validation[field.name] }</span>;
        }

        return (
            <div key={ field.name } className={ className }>
                <label htmlFor={ field.name } className='col-sm-2 control-label'>{ field.label }</label>
                <div className='col-sm-8'>
                    <input
                        type={ field.inputType }
                        className='form-control'
                        id={ field.name }
                        placeholder={ field.placeholder }
                        value={ field.value }
                        onChange={ (e) => field.onChange(e.target.value) }
                        onBlur={ field.blurCallback }
                    />
                    { validationMessage }
                </div>
            </div>
        );
    });

    const errorBar = error ? <AlertPanel type='error' message={ error } /> : null;

    return (
        <div className='col-sm-6 col-sm-offset-3'>
            { errorBar }
            <div className='panel-title'>
                Login
            </div>
            <div className='panel'>
                <form className='form form-horizontal'>
                    { fieldsToRender }
                    <div className='form-group'>
                        <div className='col-sm-offset-2 col-sm-10'>
                            <Link href='/forgot'>Forgot your password?</Link>
                        </div>
                    </div>
                    <div className='form-group'>
                        <div className='col-sm-offset-2 col-sm-3'>
                            <button type='submit' className='btn btn-primary' onClick={ onLogin }>Login</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

InnerLogin.displayName = 'Login';
InnerLogin.propTypes = {
    login: PropTypes.func,
    navigate: PropTypes.func,
    socket: PropTypes.object
};

function mapStateToProps(state) {
    return {
        socket: state.socket.socket
    };
}

const Login = connect(mapStateToProps, actions)(InnerLogin);

export default Login;
