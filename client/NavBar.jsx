import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Link from './Link.jsx';
import Avatar from './Avatar.jsx';

import * as actions from './actions';

export function InnerNavBar({ context, currentPath, leftMenu, numGames, rightMenu, title }) {
    const [showPopup, setShowPopup] = useState(undefined);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [navbarCollapsed, setNavbarCollapsed] = useState(true);
    const dropdownRef = useRef(null);

    const onMenuItemMouseOver = useCallback((menuItem) => {
        setShowPopup(menuItem);
    }, []);

    const onMenuItemMouseOut = useCallback(() => {
        setShowPopup(undefined);
    }, []);

    const handleDropdownToggle = useCallback((menuItemName, event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpenDropdown(prev => prev === menuItemName ? null : menuItemName);
    }, []);

    const handleNavbarToggle = useCallback(() => {
        setNavbarCollapsed(prev => !prev);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if(openDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    const renderMenuItem = useCallback((menuItem) => {
        if(menuItem.childItems) {
            let className = 'dropdown';
            const isOpen = openDropdown === menuItem.name;

            if(menuItem.childItems.some(item => item.path === currentPath)) {
                className += ' active';
            }

            if(isOpen) {
                className += ' open';
            }

            const childItems = menuItem.childItems.map(item => (
                <li key={ item.name }><Link href={ item.path }>{ item.name }</Link></li>
            ));

            return (
                <li key={ menuItem.name } className={ className } ref={ dropdownRef }>
                    <a href='#' className='dropdown-toggle' role='button' aria-haspopup='true' aria-expanded={ isOpen }
                        onClick={ (e) => handleDropdownToggle(menuItem.name, e) }>
                        { menuItem.avatar ? <Avatar emailHash={ menuItem.emailHash } forceDefault={ menuItem.disableGravatar } /> : null }
                        { menuItem.name }<span className='caret' />
                    </a>
                    <ul className='dropdown-menu'>
                        { childItems }
                    </ul>
                </li>
            );
        }

        const active = menuItem.path === currentPath ? 'active' : '';

        return <li key={ menuItem.name } className={ active }><Link href={ menuItem.path }>{ menuItem.name }</Link></li>;
    }, [currentPath, openDropdown, handleDropdownToggle]);

    const leftMenuToRender = leftMenu?.map(renderMenuItem);
    const rightMenuToRender = rightMenu?.map(renderMenuItem);

    const numGamesElement = numGames !== undefined ? <li><span>{ numGames + ' Games' }</span></li> : null;

    const contextMenu = context?.map(menuItem => (
        <li key={ menuItem.text }>
            <a
                href='javascript:void(0)'
                onMouseOver={ () => onMenuItemMouseOver(menuItem) }
                onMouseOut={ onMenuItemMouseOut }
                onClick={ menuItem.onClick ? (event) => {
                    event.preventDefault();
                    menuItem.onClick();
                } : null }
            >
                { menuItem.text }
            </a>
            { showPopup === menuItem ? showPopup.popup : null }
        </li>
    ));

    const navbarCollapseClass = navbarCollapsed ? 'collapse navbar-collapse' : 'collapse navbar-collapse in';

    return (
        <nav className='navbar navbar-inverse navbar-fixed-top no-highlight'>
            <div className='container'>
                <div className='navbar-header'>
                    <button className={ navbarCollapsed ? 'navbar-toggle collapsed' : 'navbar-toggle' }
                        type='button'
                        aria-expanded={ !navbarCollapsed }
                        aria-controls='navbar'
                        onClick={ handleNavbarToggle }>
                        <span className='sr-only'>Toggle Navigation</span>
                        <span className='icon-bar' />
                        <span className='icon-bar' />
                        <span className='icon-bar' />
                    </button>
                    <Link href='/' className='navbar-brand'>{ title }</Link>
                </div>
                <div id='navbar' className={ navbarCollapseClass }>
                    <ul className='nav navbar-nav'>
                        { leftMenuToRender }
                    </ul>
                    <ul className='nav navbar-nav navbar-right'>
                        { contextMenu }
                        { numGamesElement }
                        { rightMenuToRender }
                    </ul>
                </div>
            </div>
        </nav>
    );
}

InnerNavBar.displayName = 'NavBar';
InnerNavBar.propTypes = {
    context: PropTypes.array,
    currentPath: PropTypes.string,
    leftMenu: PropTypes.array,
    numGames: PropTypes.number,
    rightMenu: PropTypes.array,
    title: PropTypes.string
};

function mapStateToProps(state) {
    return {
        context: state.navigation.context
    };
}

const NavBar = connect(mapStateToProps, actions)(InnerNavBar);

export default NavBar;
