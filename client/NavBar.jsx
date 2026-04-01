import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ChevronDown } from 'lucide-react';

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
                <li key={ item.name } onClick={ () => setOpenDropdown(null) }><Link href={ item.path }>{ item.name }</Link></li>
            ));

            return (
                <li key={ menuItem.name } className={ className } ref={ dropdownRef }>
                    <a href='#' className="dropdown-toggle" role='button' aria-haspopup='true' aria-expanded={ isOpen }
                        onClick={ (e) => handleDropdownToggle(menuItem.name, e) }>
                        { menuItem.avatar ? <Avatar emailHash={ menuItem.emailHash } forceDefault={ menuItem.disableGravatar } /> : null }
                        { menuItem.name } <ChevronDown size={ 12 } style={ { display: 'inline', verticalAlign: 'middle' } } />
                    </a>
                    <ul className="dropdown-menu">
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
        <li key={ menuItem.text } style={ { position: 'relative' } }
            onMouseOver={ () => onMenuItemMouseOver(menuItem) }
            onMouseOut={ onMenuItemMouseOut }
        >
            <a
                href='javascript:void(0)'
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

    return (
        <nav className="navbar navbar-inverse no-highlight">
            <div className="max-w-[1170px] mx-auto px-4 flex items-center flex-wrap text-sm">
                <Link href='/' className="text-gray-400 font-bold text-sm py-2 leading-tight mr-2">{ title }</Link>
                <button className="md:hidden p-2 text-gray-400 ml-auto"
                    type='button'
                    aria-expanded={ !navbarCollapsed }
                    aria-controls='navbar'
                    onClick={ handleNavbarToggle }>
                    <span className="sr-only">Toggle Navigation</span>
                    <span className="block w-[22px] h-0.5 bg-gray-400 rounded my-1" />
                    <span className="block w-[22px] h-0.5 bg-gray-400 rounded my-1" />
                    <span className="block w-[22px] h-0.5 bg-gray-400 rounded my-1" />
                </button>
                <div id='navbar' className={ navbarCollapsed ? 'hidden md:flex md:items-center md:flex-1' : 'flex flex-col md:flex-row md:items-center md:flex-1 w-full md:w-auto' }>
                    <ul className="flex flex-col md:flex-row list-none m-0 p-0">
                        { leftMenuToRender }
                    </ul>
                    <ul className="flex flex-col md:flex-row list-none m-0 p-0 ml-auto">
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
