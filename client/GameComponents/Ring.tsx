import React, { useState, useEffect, memo } from "react";

import CardCounters from "./CardCounters";
import CardMenu from "./CardMenu";
import { getRingEffect } from "../RingEffectDescriptions";
import { ringSetImage, DEFAULT_RINGS } from "../boardCosmetics";
import { isClaimAnimation } from "../types/redux";
import type { Ring as RingType, MenuItem } from "../types/game";
import type { AnimationEvent } from "../types/redux";

interface RingProps {
    onClick?: (ringElement: string) => void;
    onMenuItemClick?: (ring: RingType, menuItem: MenuItem) => void;
    owner?: string;
    ring: RingType;
    size?: string;
    showRingEffects?: boolean;
    gameMode?: string;
    ringSet?: string;
    pendingAnimations?: AnimationEvent[];
    onClaimAnimationEnd?: (element: string, playerName: string) => void;
}

const CLAIM_FLASH_MS = 2500;

function Ring({ onClick, onMenuItemClick, owner, ring, size: propSize, showRingEffects, gameMode, ringSet, pendingAnimations, onClaimAnimationEnd }: RingProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // The flash is the animation still being pending, so it needs no state of its own:
    // the event is cleared once the 2.5s burst (see .ring-claim-flash) has run.
    const claimFlash = !!owner && !!pendingAnimations?.some(
        (a) => isClaimAnimation(a) && a.element === ring.element && a.playerName === owner
    );

    useEffect(() => {
        if(!claimFlash) {
            return;
        }
        const timer = setTimeout(() => onClaimAnimationEnd?.(ring.element, owner as string), CLAIM_FLASH_MS);
        return () => clearTimeout(timer);
    }, [claimFlash, onClaimAnimationEnd, ring.element, owner]);

    const handleClick = (event: React.MouseEvent, ringElement: string) => {
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

    const handleMenuItemClick = (menuItem: MenuItem) => {
        if(onMenuItemClick) {
            onMenuItemClick(ring, menuItem);
            setShowMenu(!showMenu);
        }
    };

    const getCountersForRing = () => {
        const counters: Record<string, { count: number; fade?: boolean; shortName?: string } | undefined> = {};

        counters["ring-fate"] = ring.fate
            ? { count: ring.fate, shortName: "F" }
            : undefined;

        if(ring.tokens) {
            const shortNames = {
                honor: "H",
                fate: "F"
            };
            for(const [key, token] of Object.entries(ring.tokens as Record<string, number>)) {
                counters[key] = {
                    count: token,
                    fade: ring.type === "attachment",
                    shortName: (shortNames as Record<string, string>)[key]
                };
            }
        }

        const filteredCounters: Record<string, { count: number; fade?: boolean; shortName?: string }> = {};
        for(const [key, counter] of Object.entries(counters)) {
            if(counter !== null && counter !== undefined && counter.count >= 0) {
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

    let size = propSize;
    if(ring.claimed) {
        size = "small";
    }

    let className = `ring icon-element-${ring.element}${size ? ` ${size}` : ""}`;
    let bgClassName = `ring-background tint-${ring.conflictType}${size ? ` ${size}` : ""}`;
    let svgClassName = `ring-svg tint-${ring.conflictType}${size ? ` ${size}` : ""}${ring.selected || ring.contested ? " contested" : ""}`;
    if(ring.unselectable) {
        className += " unselectable";
        bgClassName += " unselectable";
    }

    let visible = true;
    if(
        (owner && (!ring.claimed || owner !== ring.claimedBy)) ||
        (!owner && ring.claimed)
    ) {
        className += " hidden";
        svgClassName += " hidden";
        visible = false;
    }
    if(!visible) {
        return <div />;
    }

    const shouldShowTooltip = showRingEffects && isHovered && !ring.claimed && !showMenu;
    const ringEffect = shouldShowTooltip ? getRingEffect(gameMode, ring.element) : "";

    // A patron ring set overlays an image and hides the stock glyph; "default" keeps the glyph.
    const ringImageSrc = ringSet && ringSet !== DEFAULT_RINGS ? ringSetImage(ringSet, ring.conflictType, ring.element) : "";

    return (
        <div
            className={ `ring no-highlight ring-element-${ring.element}${ring.unselectable ? " unselectable" : ""}${claimFlash ? " ring-claim-flash" : ""}` }
            onClick={ (event) => handleClick(event, ring.element) }
            onMouseEnter={ () => setIsHovered(true) }
            onMouseLeave={ () => setIsHovered(false) }
        >
            <svg className={ svgClassName }>
                { ringImageSrc ? null : <circle cx="50%" cy="50%" r="50%" className={ bgClassName } /> }
            </svg>
            { ringImageSrc ? (
                <img
                    className={ `ring-patron-image tint-${ring.conflictType}${ring.selected || ring.contested ? " contested" : ""}` }
                    src={ ringImageSrc }
                    alt={ ring.element }
                />
            ) : null }
            <div className={ ringImageSrc ? `${className} ring-glyph-hidden` : className } />
            { shouldShowCounters() && visible ? (
                <CardCounters counters={ getCountersForRing() } />
            ) : null }
            { shouldShowMenu() ? (
                <CardMenu menu={ ring.menu } onMenuItemClick={ handleMenuItemClick } />
            ) : null }
            { shouldShowTooltip && ringEffect ? (
                <div className="ring-tooltip">
                    <div className="ring-tooltip-title">{ `${ring.element.charAt(0).toUpperCase()}${ring.element.slice(1)}` }</div>
                    <div className="ring-tooltip-text">{ ringEffect }</div>
                </div>
            ) : null }
        </div>
    );
}

Ring.displayName = "Ring";

export default memo(Ring);
