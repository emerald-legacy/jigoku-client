import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { X } from 'lucide-react';
import AlertPanel from './SiteComponents/AlertPanel.jsx';
import Input from './FormComponents/Input.jsx';

import * as actions from './actions';

export function InnerBlockList({
    addBlockListEntry,
    apiError,
    blockList,
    blockListAdded,
    blockListDeleted,
    clearBlockListStatus,
    loadBlockList,
    loading,
    removeBlockListEntry,
    user
}) {
    const [username, setUsername] = useState('');

    useEffect(() => {
        loadBlockList(user);
    }, [loadBlockList, user]);

    useEffect(() => {
        if(blockListAdded || blockListDeleted) {
            const timer = setTimeout(() => {
                clearBlockListStatus();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [blockListAdded, blockListDeleted, clearBlockListStatus]);

    const onUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const onAddClick = (event) => {
        event.preventDefault();
        addBlockListEntry(user, username);
    };

    const onRemoveClick = (usernameToRemove, event) => {
        event.preventDefault();
        removeBlockListEntry(user, usernameToRemove);
    };

    let successPanel;

    if(blockListAdded) {
        successPanel = (
            <AlertPanel message='Block list entry added successfully' type='success' />
        );
    }

    if(blockListDeleted) {
        successPanel = (
            <AlertPanel message='Block list entry removed successfully' type='success' />
        );
    }

    let content;

    if(loading) {
        content = <div>Loading block list from the server...</div>;
    } else if(apiError) {
        content = <AlertPanel type='error' message={ apiError } />;
    } else {
        const blockListRows = blockList && blockList.map((blockedUser) => (
            <tr key={ blockedUser }>
                <td>{ blockedUser }</td>
                <td>
                    <a href='#' className='btn' onClick={ (e) => onRemoveClick(blockedUser, e) }>
                        <X size={ 16 } />
                    </a>
                </td>
            </tr>
        ));

        const table = (!blockList || blockList.length === 0) ? (
            <div>No users currently blocked</div>
        ) : (
            <table className='table table-striped blocklist'>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>
                    { blockListRows }
                </tbody>
            </table>
        );

        content = (
            <div className='col-sm-8 col-sm-offset-2 full-height'>
                <div className='about-container'>
                    { successPanel }

                    <form className='form form-horizontal'>
                        <div className='panel-title text-center'>
                            Block list
                        </div>
                        <div className='panel'>
                            <p>
                                It can sometimes become necessary to prevent someone joining your games,
                                or stop seeing their messages, or both. Users on this list will not be
                                able to join your games, and you will not see their chat messages or their games.
                            </p>

                            <div className='form-group'>
                                <Input
                                    name='blockee'
                                    label='Username'
                                    labelClass='col-sm-4'
                                    fieldClass='col-sm-4'
                                    placeholder='Enter username to block'
                                    type='text'
                                    onChange={ onUsernameChange }
                                    value={ username }
                                    noGroup
                                />
                                <button className='btn btn-primary col-sm-1' onClick={ onAddClick }>Add</button>
                            </div>

                            <h3>Users Blocked</h3>
                            { table }
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return content;
}

InnerBlockList.displayName = 'BlockList';
InnerBlockList.propTypes = {
    addBlockListEntry: PropTypes.func,
    apiError: PropTypes.string,
    blockList: PropTypes.array,
    blockListAdded: PropTypes.bool,
    blockListDeleted: PropTypes.bool,
    clearBlockListStatus: PropTypes.func,
    loadBlockList: PropTypes.func,
    loading: PropTypes.bool,
    removeBlockListEntry: PropTypes.func,
    user: PropTypes.object
};

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        blockList: state.user.blockList,
        blockListAdded: state.user.blockListAdded,
        blockListDeleted: state.user.blockListDeleted,
        loading: state.api.loading,
        user: state.auth.user
    };
}

const BlockList = connect(mapStateToProps, actions)(InnerBlockList);

export default BlockList;
