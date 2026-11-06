import React, { useState, useRef, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import Avatar from "./Avatar";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";

interface NavMenuItem {
    name: string;
    path?: string;
    childItems?: NavMenuItem[];
    avatar?: boolean;
    emailHash?: string;
    disableGravatar?: boolean;
    isPatron?: boolean;
}

interface NavContextItem {
    text: string;
    onClick?: () => void;
    popup?: React.ReactNode;
}

interface InnerNavBarProps {
    context?: NavContextItem[];
    leftMenu?: NavMenuItem[];
    numGames?: number;
    rightMenu?: NavMenuItem[];
    title?: string;
}

export function InnerNavBar({ context, leftMenu, numGames, rightMenu, title }: InnerNavBarProps) {
    const currentPath = useLocation().pathname;
    const [showPopup, setShowPopup] = useState<NavContextItem | undefined>(undefined);
    // The mobile menu and the dropdowns remember the path they were opened on, so they close by themselves when a tap navigates away.
    const [openedDropdown, setOpenedDropdown] = useState<{ name: string; path: string } | null>(null);
    const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null);
    const openDropdown = openedDropdown?.path === currentPath ? openedDropdown.name : null;
    const navbarCollapsed = menuOpenedOn !== currentPath;
    const navRef = useRef<HTMLElement | null>(null);

    const onMenuItemMouseOver = (menuItem: NavContextItem) => {
        setShowPopup(menuItem);
    };

    const onMenuItemMouseOut = () => {
        setShowPopup(undefined);
    };

    const handleDropdownToggle = (menuItemName: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setOpenedDropdown(openDropdown === menuItemName ? null : { name: menuItemName, path: currentPath });
    };

    const handleNavbarToggle = () => {
        setMenuOpenedOn(navbarCollapsed ? currentPath : null);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            if(!target?.closest(".dropdown.open")) {
                setOpenedDropdown(null);
            }
            if(!navRef.current?.contains(target)) {
                setMenuOpenedOn(null);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if(event.key === "Escape") {
                setOpenedDropdown(null);
                setMenuOpenedOn(null);
            }
        };

        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const renderMenuItem = (menuItem: NavMenuItem) => {
        if(menuItem.childItems) {
            let className = "dropdown";
            const isOpen = openDropdown === menuItem.name;

            if(menuItem.childItems.some((item: NavMenuItem) => item.path === currentPath)) {
                className += " active";
            }

            if(isOpen) {
                className += " open";
            }

            const childItems = menuItem.childItems.map((item: NavMenuItem) => (
                <li key={ item.name } className={ item.path === currentPath ? "active" : "" } onClick={ () => setOpenedDropdown(null) }><Link to={ item.path ?? "#" }>{ item.name }</Link></li>
            ));

            return (
                <li key={ menuItem.name } className={ className }>
                    <a href="#" className="dropdown-toggle" role="button" aria-haspopup="true" aria-expanded={ isOpen }
                        onClick={ (e) => handleDropdownToggle(menuItem.name, e) }>
                        { menuItem.avatar ? <Avatar emailHash={ menuItem.emailHash } forceDefault={ menuItem.disableGravatar } /> : null }
                        { menuItem.isPatron ? <span className="patron-name">{ menuItem.name }</span> : menuItem.name } <ChevronDown size={ 12 } style={ { display: "inline", verticalAlign: "middle" } } />
                    </a>
                    <ul className="dropdown-menu">
                        { childItems }
                    </ul>
                </li>
            );
        }

        const active = menuItem.path === currentPath ? "active" : "";

        return <li key={ menuItem.name } className={ active }><Link to={ menuItem.path ?? "#" }>{ menuItem.name }</Link></li>;
    };

    const leftMenuToRender = leftMenu?.map(renderMenuItem);
    const rightMenuToRender = rightMenu?.map(renderMenuItem);

    const numGamesElement = numGames !== undefined ? <li><span>{ numGames === 1 ? "1 Game" : `${numGames} Games` }</span></li> : null;

    const contextMenu = context?.map((menuItem: NavContextItem) => (
        <li key={ menuItem.text } style={ { position: "relative" } }
            onMouseOver={ () => onMenuItemMouseOver(menuItem) }
            onMouseOut={ onMenuItemMouseOut }
        >
            <a
                href="#"
                onClick={ (event) => {
                    event.preventDefault();
                    menuItem.onClick?.();
                } }
            >
                { menuItem.text }
            </a>
            { showPopup === menuItem ? showPopup.popup : null }
        </li>
    ));

    return (
        <nav ref={ navRef } className={ navbarCollapsed ? "navbar navbar-inverse no-highlight" : "navbar navbar-inverse navbar-open no-highlight" }>
            <div className="max-w-[1170px] mx-auto px-4 flex items-center flex-wrap text-body">
                <Link to="/" className="navbar-brand">{ title }</Link>
                <button className="navbar-toggle md:hidden"
                    type="button"
                    aria-expanded={ !navbarCollapsed }
                    aria-controls="navbar"
                    onClick={ handleNavbarToggle }>
                    <span className="sr-only">Toggle Navigation</span>
                    <span className="navbar-toggle-bar" />
                    <span className="navbar-toggle-bar" />
                    <span className="navbar-toggle-bar" />
                </button>
                <div id="navbar" className={ navbarCollapsed ? "navbar-menu hidden md:flex" : "navbar-menu flex" }>
                    <ul className="navbar-list">
                        { leftMenuToRender }
                    </ul>
                    <ul className="navbar-list navbar-list-right">
                        { contextMenu }
                        { numGamesElement }
                        { rightMenuToRender }
                    </ul>
                </div>
            </div>
        </nav>
    );
}

InnerNavBar.displayName = "NavBar";

function mapStateToProps(state: RootState) {
    return {
        context: state.navigation.context
    };
}

interface NavBarOwnProps {
    leftMenu?: NavMenuItem[];
    numGames?: number;
    rightMenu?: NavMenuItem[];
    title?: string;
}

export default function NavBar(ownProps: NavBarOwnProps) {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    const merged = { ...props, ...boundActions, ...ownProps } as unknown as InnerNavBarProps;
    return <InnerNavBar { ...merged } />;
}
