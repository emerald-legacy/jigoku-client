import { useState, memo } from 'react';
import PropTypes from 'prop-types';

import CardCounters from './CardCounters.jsx';
import CardMenu from './CardMenu.jsx';

function Ring({ onClick, onMenuItemClick, owner, ring, size: propSize }) {
    const [showMenu, setShowMenu] = useState(false);

    const handleClick = (event, ringElement) => {
        event.preventDefault();
        event.stopPropagation();

        if(ring.menu && ring.menu.length > 0) {
            setShowMenu(!showMenu);
            return;
        }

        if(onClick) {
            onClick(ringElement);
        }
    };

    const handleMenuItemClick = (menuItem) => {
        if(onMenuItemClick) {
            onMenuItemClick(ring, menuItem);
            setShowMenu(!showMenu);
        }
    };

    const getCountersForRing = () => {
        const counters = {};

        counters['ring-fate'] = ring.fate
            ? { count: ring.fate, shortName: 'F' }
            : undefined;

        if(ring.tokens) {
            const shortNames = {
                honor: 'H',
                fate: 'F'
            };
            for(const [key, token] of Object.entries(ring.tokens)) {
                counters[key] = {
                    count: token,
                    fade: ring.type === 'attachment',
                    shortName: shortNames[key]
                };
            }
        }

        // Filter out undefined, null, or negative counters
        const filteredCounters = {};
        for(const [key, counter] of Object.entries(counters)) {
            if(counter !== undefined && counter !== null && counter.count >= 0) {
                filteredCounters[key] = counter;
            }
        }

        return filteredCounters;
    };

    const shouldShowCounters = () => {
        return true;
    };

    const shouldShowMenu = () => {
        if(!ring.menu || !showMenu) {
            return false;
        }
        return true;
    };

    const getIcon = () => {
        if(ring.conflictType === 'military') {
            return (
                <span className='icon-military'>
                    <span className='hide-text'>military</span>
                </span>
            );
        }
        return (
            <span className='icon-political'>
                <span className='hide-text'>political</span>
            </span>
        );
    };

    let size = propSize;
    if(ring.claimed) {
        size = 'small';
    }

    let className = 'ring icon-element-' + ring.element + (size ? ' ' + size : '');
    let bgClassName = 'ring-background tint-' + ring.conflictType + (size ? ' ' + size : '');
    let svgClassName =
        'ring-svg tint-' +
        ring.conflictType +
        (size ? ' ' + size : '') +
        (ring.selected || ring.contested ? ' contested' : '');
    if(ring.unselectable) {
        className = className + ' unselectable';
        bgClassName += ' unselectable';
    }

    let visible = true;
    if(
        (owner && (!ring.claimed || owner !== ring.claimedBy)) ||
        (!owner && ring.claimed)
    ) {
        className += ' hidden';
        svgClassName += ' hidden';
        visible = false;
    }
    if(!visible) {
        return <div />;
    }
    return (
        <div
            className={ 'ring no-highlight' + (ring.unselectable ? ' unselectable' : '') }
            onClick={ (event) => handleClick(event, ring.element) }
        >
            <svg className={ svgClassName }>
                <circle cx='50%' cy='50%' r='50%' className={ bgClassName } />
            </svg>
            <div className={ className } />
            { shouldShowCounters() && visible ? (
                <CardCounters counters={ getCountersForRing() } />
            ) : null }
            { shouldShowMenu() ? (
                <CardMenu menu={ ring.menu } onMenuItemClick={ handleMenuItemClick } />
            ) : null }
        </div>
    );
}

Ring.displayName = 'Ring';
Ring.propTypes = {
    buttons: PropTypes.array,
    onClick: PropTypes.func,
    onMenuItemClick: PropTypes.func,
    owner: PropTypes.string,
    ring: PropTypes.object,
    size: PropTypes.string,
    socket: PropTypes.object
};

export default memo(Ring);
