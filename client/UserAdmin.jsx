import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import Input from './FormComponents/Input.jsx';
import Checkbox from './FormComponents/Checkbox.jsx';

import * as actions from './actions';

const defaultPermissions = {
    canEditNews: false,
    canManageUsers: false
};

const permissionsList = [
    { name: 'canEditNews', label: 'News Editor' },
    { name: 'canManageUsers', label: 'User Manager' }
];

export function InnerUserAdmin({ apiError, apiStatus, clearUserStatus, currentUser, findUser, loading, saveUser, userSaved }) {
    const [permissions, setPermissions] = useState(currentUser ? (currentUser.permissions || defaultPermissions) : defaultPermissions);
    const [username, setUsername] = useState('');

    useEffect(() => {
        setPermissions(currentUser ? (currentUser.permissions || defaultPermissions) : defaultPermissions);
    }, [currentUser]);

    useEffect(() => {
        if(userSaved) {
            const timer = setTimeout(() => {
                clearUserStatus();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [userSaved, clearUserStatus]);

    const onUsernameChange = useCallback((event) => {
        setUsername(event.target.value);
    }, []);

    const onFindClick = useCallback((event) => {
        event.preventDefault();
        findUser(username);
    }, [findUser, username]);

    const onSaveClick = useCallback((event) => {
        event.preventDefault();
        currentUser.permissions = permissions;
        saveUser(currentUser);
    }, [currentUser, permissions, saveUser]);

    const onPermissionToggle = useCallback((field, event) => {
        setPermissions(prev => ({
            ...prev,
            [field]: event.target.checked
        }));
    }, []);

    let content = null;
    let successPanel = null;

    if(userSaved) {
        successPanel = (
            <AlertPanel message='User saved successfully' type='success' />
        );
    }

    const notFoundMessage = apiStatus === 404 ? <AlertPanel type='warning' message='No users found' /> : null;

    let renderedUser = null;

    if(currentUser) {
        const permissionsElements = permissionsList.map((permission) => (
            <Checkbox
                key={ permission.name }
                name={ 'permissions.' + permission.name }
                label={ permission.label }
                fieldClass='col-sm-offset-3 col-sm-4'
                type='checkbox'
                onChange={ (e) => onPermissionToggle(permission.name, e) }
                checked={ permissions[permission.name] }
            />
        ));

        renderedUser = (
            <div>
                <h3>User details</h3>

                <form className='form'>
                    <dl>
                        <dt>Username:</dt><dd>{ currentUser.username }</dd>
                        <dt>Email:</dt><dd>{ currentUser.email }</dd>
                        <dt>Registered:</dt><dd>{ currentUser.registered }</dd>
                    </dl>

                    <h4>Permissions</h4>
                    { permissionsElements }
                    <button type='button' className='btn btn-primary' onClick={ onSaveClick }>Save</button>
                </form>
            </div>
        );
    }

    if(loading) {
        content = <div>Searching for user...</div>;
    } else if(apiError && apiStatus !== 404) {
        content = <AlertPanel type='error' message={ apiError } />;
    } else {
        content = (
            <div>
                { notFoundMessage }
                { successPanel }
                <form className='form'>
                    <Input name='username' label='Search for a user' value={ username } onChange={ onUsernameChange } placeholder='Enter username' />
                    <button type='submit' className='btn btn-primary' onClick={ onFindClick }>Find</button>
                </form>

                { renderedUser }
            </div>
        );
    }

    return content;
}

InnerUserAdmin.displayName = 'UserAdmin';
InnerUserAdmin.propTypes = {
    apiError: PropTypes.string,
    apiStatus: PropTypes.number,
    clearUserStatus: PropTypes.func,
    currentUser: PropTypes.object,
    findUser: PropTypes.func,
    loading: PropTypes.bool,
    saveUser: PropTypes.func,
    userSaved: PropTypes.bool
};

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        apiStatus: state.api.status,
        currentUser: state.admin.currentUser,
        loading: state.api.loading,
        userSaved: state.admin.userSaved
    };
}

const UserAdmin = connect(mapStateToProps, actions)(InnerUserAdmin);

export default UserAdmin;
