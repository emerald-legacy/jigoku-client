import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import * as actions from './actions';

export function InnerRegister({ navigate, register, socket }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password1, setPassword1] = useState('');
    const [validation, setValidation] = useState({});
    const [error, setError] = useState('');

    const verifyUsername = useCallback(
        (isSubmitting, currentUsername = username) => {
            const newValidation = { ...validation };
            delete newValidation['username'];

            if(currentUsername.length < 3 || currentUsername.length > 15) {
                newValidation['username'] =
                    'Username must be between 3 and 15 characters long';
            }

            if(!/^[A-Z0-9_-]+$/i.test(currentUsername)) {
                newValidation['username'] =
                    'Usernames must only use the characters a-z, 0-9, _ and -';
            }

            if(isSubmitting) {
                return newValidation;
            }

            axios
                .post('/api/account/check-username', { username: currentUsername })
                .then((response) => {
                    if(response.data.message) {
                        newValidation['username'] = response.data.message;
                    }
                })
                .finally(() => {
                    setValidation({ ...newValidation });
                });

            return newValidation;
        },
        [username, validation]
    );

    const verifyEmail = useCallback(
        (currentEmail = email) => {
            const newValidation = { ...validation };
            delete newValidation['email'];

            if(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(currentEmail)) {
                newValidation['email'] = 'Please enter a valid email address';
            }

            return newValidation;
        },
        [email, validation]
    );

    const verifyPassword = useCallback(
        (isSubmitting, currentPassword = password, currentPassword1 = password1) => {
            const newValidation = { ...validation };
            delete newValidation['password'];

            if(currentPassword.length < 6) {
                newValidation['password'] =
                    'The password you specify must be at least 6 characters long';
            }

            if(isSubmitting && !currentPassword1) {
                newValidation['password'] = 'Please enter your password again';
            }

            if(
                currentPassword &&
                currentPassword1 &&
                currentPassword !== currentPassword1
            ) {
                newValidation['password'] =
                    'The passwords you have specified do not match';
            }

            return newValidation;
        },
        [password, password1, validation]
    );

    const handleUsernameBlur = () => {
        const newValidation = verifyUsername(false, username);
        setValidation(newValidation);
    };

    const handleEmailBlur = () => {
        const newValidation = verifyEmail(email);
        setValidation(newValidation);
    };

    const handlePasswordBlur = () => {
        const newValidation = verifyPassword(false, password, password1);
        setValidation(newValidation);
    };

    const onRegister = (event) => {
        event.preventDefault();

        setError('');

        // Validate all fields synchronously
        let combinedValidation = {};

        // Check email
        if(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
            combinedValidation['email'] = 'Please enter a valid email address';
        }

        // Check password
        if(password.length < 6) {
            combinedValidation['password'] =
                'The password you specify must be at least 6 characters long';
        }
        if(!password1) {
            combinedValidation['password'] = 'Please enter your password again';
        }
        if(password && password1 && password !== password1) {
            combinedValidation['password'] =
                'The passwords you have specified do not match';
        }

        // Check username
        if(username.length < 3 || username.length > 15) {
            combinedValidation['username'] =
                'Username must be between 3 and 15 characters long';
        }
        if(!/^[A-Z0-9_-]+$/i.test(username)) {
            combinedValidation['username'] =
                'Usernames must only use the characters a-z, 0-9, _ and -';
        }

        setValidation(combinedValidation);

        // Check if any validation errors exist
        const hasErrors = Object.values(combinedValidation).some(
            (message) => message && message !== ''
        );

        if(hasErrors) {
            setError(
                'There was an error in one or more fields, please see below, correct the error and try again'
            );
            return;
        }

        axios
            .post('/api/account/register', { username, password, email })
            .then((response) => {
                const data = response.data;
                if(!data.success) {
                    setError(data.message);
                    return;
                }

                register(data.user, data.token);
                socket.emit('authenticate', data.token);
                navigate('/');
            })
            .catch(() => {
                setError('Could not communicate with the server.  Please try again later.');
            });
    };

    const fields = [
        {
            name: 'username',
            label: 'Username',
            placeholder: 'Username',
            inputType: 'text',
            blurCallback: handleUsernameBlur,
            value: username,
            onChange: (e) => setUsername(e.target.value)
        },
        {
            name: 'email',
            label: 'email Address',
            placeholder: 'email Address',
            inputType: 'email',
            blurCallback: handleEmailBlur,
            value: email,
            onChange: (e) => setEmail(e.target.value)
        },
        {
            name: 'password',
            label: 'Password',
            placeholder: 'Password',
            inputType: 'password',
            blurCallback: handlePasswordBlur,
            value: password,
            onChange: (e) => setPassword(e.target.value)
        },
        {
            name: 'password1',
            label: 'Password (again)',
            placeholder: 'Password (again)',
            inputType: 'password',
            blurCallback: handlePasswordBlur,
            value: password1,
            onChange: (e) => setPassword1(e.target.value)
        }
    ];

    const fieldsToRender = fields.map((field) => {
        let className = 'form-group';
        let validationElement = null;

        if(validation[field.name]) {
            className += ' has-error';
            validationElement = (
                <span className="help-block">{ validation[field.name] }</span>
            );
        }

        return (
            <div key={ field.name } className={ className }>
                <label htmlFor={ field.name } className="col-sm-4 control-label">
                    { field.label }
                </label>
                <div className="col-sm-7">
                    <input
                        type={ field.inputType }
                        className="form-control"
                        id={ field.name }
                        placeholder={ field.placeholder }
                        value={ field.value }
                        onChange={ field.onChange }
                        onBlur={ field.blurCallback }
                    />
                    { validationElement }
                </div>
            </div>
        );
    });

    const errorBar = error ? <AlertPanel type='error' message={ error } /> : null;

    return (
        <div className="col-sm-6 col-sm-offset-3">
            { errorBar }
            <div className="panel-title">Register an account</div>
            <div className="panel">
                <form className="form form-horizontal">
                    { fieldsToRender }
                    <div className="form-group">
                        <div className="col-sm-offset-4 col-sm-3">
                            <button
                                type='submit'
                                className="btn btn-primary"
                                onClick={ onRegister }
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

InnerRegister.displayName = 'Register';
InnerRegister.propTypes = {
    navigate: PropTypes.func,
    register: PropTypes.func,
    socket: PropTypes.object
};

function mapStateToProps(state) {
    return {
        socket: state.socket.socket
    };
}

const Register = connect(mapStateToProps, actions)(InnerRegister);

export default Register;
