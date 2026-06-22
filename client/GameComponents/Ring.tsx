import React, { useState, useEffect, useRef, memo } from "react";

import CardCounters from "./CardCounters";
import CardMenu from "./CardMenu";
import { getRingEffect } from "../RingEffectDescriptions";
import type { Ring as RingType, MenuItem } from "../types/game";

interface RingProps {
    onClick?: (ringElement: string) => void;
    onMenuItemClick?: (ring: RingType, menuItem: MenuItem) => void;
    owner?: string;
    ring: RingType;
    size?: string;
    showRingEffects?: boolean;
    gameMode?: string;
    patron?: boolean;
}

function Ring({ onClick, onMenuItemClick, owner, ring, size: propSize, showRingEffects, gameMode, patron }: RingProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [claimFlash, setClaimFlash] = useState(false);

    const isClaimedHere = !!owner && !!ring.claimed && owner === ring.claimedBy;
    const wasClaimedHereRef = useRef(isClaimedHere);

    useEffect(() => {
        if(!wasClaimedHereRef.current && isClaimedHere) {
            setClaimFlash(true);
            const t = setTimeout(() => setClaimFlash(false), 2500);
            wasClaimedHereRef.current = isClaimedHere;
            return () => clearTimeout(t);
        }
        wasClaimedHereRef.current = isClaimedHere;
    }, [isClaimedHere]);

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
            if(counter != null && counter.count >= 0) { // eslint-disable-line eqeqeq
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getIcon = () => {
        if(ring.conflictType === "military") {
            return (
                <span className="icon-military">
                    <span className="hide-text">military</span>
                </span>
            );
        }
        return (
            <span className="icon-political">
                <span className="hide-text">political</span>
            </span>
        );
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

    return (
        <div
            className={ `ring no-highlight ring-element-${ring.element}${ring.unselectable ? " unselectable" : ""}${claimFlash ? " ring-claim-flash" : ""}` }
            onClick={ (event) => handleClick(event, ring.element) }
            onMouseEnter={ () => setIsHovered(true) }
            onMouseLeave={ () => setIsHovered(false) }
        >
            <svg className={ svgClassName }>
                <circle cx="50%" cy="50%" r="50%" className={ bgClassName } />
            </svg>
            <div className={ className } />
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
