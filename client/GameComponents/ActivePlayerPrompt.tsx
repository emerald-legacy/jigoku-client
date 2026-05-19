import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";

import AbilityTargeting from "./AbilityTargeting";
import CardNameLookup from "./CardNameLookup";
import type { Button, Card, Control, UserSettings } from "../types/game";

function isEqual(a: unknown, b: unknown): boolean {
    if(a === b) {
        return true;
    }
    if(a === null || a === undefined || b === null || b === undefined) {
        return false;
    }
    if(typeof a !== "object" || typeof b !== "object") {
        return a === b;
    }

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if(keysA.length !== keysB.length) {
        return false;
    }

    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;

    for(const key of keysA) {
        if(!keysB.includes(key) || !isEqual(objA[key], objB[key])) {
            return false;
        }
    }

    return true;
}

function buttonsAreEqual(oldButtons: Button[] | undefined, newButtons: Button[] | undefined): boolean {
    if(!oldButtons || !newButtons || oldButtons.length !== newButtons.length) {
        return false;
    }

    for(let i = 0; i < oldButtons.length; ++i) {
        if(!isEqual(oldButtons[i], newButtons[i])) {
            return false;
        }
    }

    return true;
}

interface PromptUser {
    settings?: UserSettings;
    [key: string]: any;
}

interface ActivePlayerPromptProps {
    buttons?: Button[];
    cards?: Card[];
    controls?: Control[];
    onButtonClick?: (command: string | undefined, arg: string | undefined, uuid: string | undefined, method: string | undefined) => void;
    onMouseOut?: (card: Card) => void;
    onMouseOver?: (card: Card) => void;
    onTimerExpired?: () => void;
    onTitleClick?: () => void;
    phase?: string;
    promptTitle?: string;
    title?: string;
    user?: PromptUser;
}

function ActivePlayerPrompt({
    buttons,
    cards,
    controls,
    onButtonClick,
    onMouseOut,
    onMouseOver,
    onTimerExpired,
    onTitleClick,
    phase,
    promptTitle,
    title,
    user
}: ActivePlayerPromptProps) {
    const [showTimer, setShowTimer] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerClass, setTimerClass] = useState("100%");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [timerCancelled, setTimerCancelled] = useState(false);

    const timerRef = useRef<{ started: Date | null; timerTime: number }>({ started: null, timerTime: 0 });
    const timerHandleRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevButtonsRef = useRef(buttons);
    const draggableRef = useRef<HTMLDivElement | null>(null);

    // Effect to handle timer when buttons change
    useEffect(() => {
        const prevButtons = prevButtonsRef.current;
        prevButtonsRef.current = buttons;

        // Check if buttons actually changed
        const buttonsChanged = !buttonsAreEqual(prevButtons, buttons);
        if(!buttonsChanged) {
            return;
        }

        if(!user?.settings?.windowTimer) {
            return;
        }

        const hasTimerButton = buttons?.some((button: Button) => button.timer);
        if(hasTimerButton) {
            if(timerHandleRef.current) {
                return;
            }

            timerRef.current.started = new Date();
            timerRef.current.timerTime = user.settings.windowTimer;

            const handle = setInterval(() => {
                const now = new Date();
                const startedAt = timerRef.current.started ? timerRef.current.started.getTime() : now.getTime();
                const difference = (now.getTime() - startedAt) / 1000;

                if(difference >= timerRef.current.timerTime) {
                    if(timerHandleRef.current) {
                        clearInterval(timerHandleRef.current);
                    }
                    timerHandleRef.current = null;
                    setShowTimer(false);

                    if(onTimerExpired) {
                        onTimerExpired();
                    }
                    return;
                }

                const newTimerClass = `${(((timerRef.current.timerTime - difference) / timerRef.current.timerTime) * 100).toFixed()}%`;
                setTimerClass(newTimerClass);
                setTimeLeft(Number((timerRef.current.timerTime - difference).toFixed()));
            }, 100);

            timerHandleRef.current = handle;
            setShowTimer(true);
            setTimerClass("100%");
        }

        return () => {
            if(timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
                timerHandleRef.current = null;
            }
        };
    }, [buttons, user, onTimerExpired]);

    const handleButtonClick = (event: React.MouseEvent, command: string | undefined, arg: string | undefined, uuid: string | undefined, method: string | undefined) => {
        event.preventDefault();

        if(timerHandleRef.current) {
            clearInterval(timerHandleRef.current);
            timerHandleRef.current = null;
        }

        setShowTimer(false);
        setTimerCancelled(true);

        if(onButtonClick) {
            onButtonClick(command, arg, uuid, method);
        }
    };

    const handleCancelTimerClick = (event: React.MouseEvent, button: Button) => {
        event.preventDefault();

        if(timerHandleRef.current) {
            clearInterval(timerHandleRef.current);
            timerHandleRef.current = null;
        }

        setShowTimer(false);
        setTimerCancelled(true);

        if(button.method && onButtonClick) {
            onButtonClick(button.command, button.arg, button.uuid, button.method);
        }
    };

    const handleMouseOver = (_event: React.MouseEvent, card: Card | undefined) => {
        if(card && onMouseOver) {
            onMouseOver(card);
        }
    };

    const handleMouseOut = (_event: React.MouseEvent, card: Card | undefined) => {
        if(card && onMouseOut) {
            onMouseOut(card);
        }
    };

    const handleCardNameSelected = (command: string | undefined, uuid: string | undefined, method: string | undefined, cardName: string) => {
        if(onButtonClick) {
            onButtonClick(command, cardName, uuid, method);
        }
    };

    const renderedButtons = (() => {
        if(!buttons) {
            return [];
        }

        let buttonIndex = 0;
        const result: React.ReactNode[] = [];

        for(const button of buttons) {
            if(button.timer) {
                continue;
            }

            const clickCallback = button.timerCancel
                ? (event: React.MouseEvent) => handleCancelTimerClick(event, button)
                : (event: React.MouseEvent) => handleButtonClick(event, button.command, button.arg, button.uuid, button.method);

            const option = (
                <button
                    key={ (button.command ?? "") + buttonIndex.toString() }
                    className="btn btn-default"
                    onClick={ clickCallback }
                    onMouseOver={ (event: React.MouseEvent) => handleMouseOver(event, button.card) }
                    onMouseOut={ (event: React.MouseEvent) => handleMouseOut(event, button.card) }
                    disabled={ button.disabled }
                >
                    { button.text }
                </button>
            );

            buttonIndex++;
            result.push(option);
        }

        return result;
    })();

    const renderedControls = (() => {
        if(!controls) {
            return [];
        }

        return controls.map((control: Control, index: number) => {
            switch(control.type) {
                case "targeting":
                    return (
                        <AbilityTargeting
                            key={ index }
                            onMouseOut={ onMouseOut }
                            onMouseOver={ onMouseOver }
                            source={ control.source }
                            targets={ control.targets }
                        />
                    );
                case "card-name":
                    return (
                        <CardNameLookup
                            key={ index }
                            cards={ cards }
                            onCardSelected={ (cardName: string) => handleCardNameSelected(control.command, control.uuid, control.method, cardName) }
                        />
                    );
                default:
                    return null;
            }
        });
    })();

    const getDefaultPosition = () => ({
        x: (window.innerWidth / 2) - 105,
        y: (window.innerHeight / 2) - 211
    });

    const activePromptBounds = {
        top: 0,
        bottom: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - 172,
        left: 0,
        right: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - 210
    };

    let promptTitleElement = null;
    if(promptTitle) {
        promptTitleElement = <div className="menu-pane-source">{ promptTitle }</div>;
    }

    let timer = null;
    if(showTimer) {
        timer = (
            <div>
                <span>Auto passing in { timeLeft }...</span>
                <div className="progress">
                    <div className="progress-bar progress-bar-success" role="progressbar" style={ { width: timerClass } } />
                </div>
            </div>
        );
    }

    return (
        <Draggable handle=".grip" bounds={ activePromptBounds } defaultPosition={ getDefaultPosition() } nodeRef={ draggableRef }>
            <div ref={ draggableRef } className="no-highlight">
                { timer }
                <div className="grip">
                    <div className={ `phase-indicator ${phase}` } onClick={ onTitleClick }>
                        { phase } phase
                    </div>
                </div>
                { promptTitleElement }
                <div className="menu-pane">
                    <div className="panel">
                        <div className="menu-pane-title">{ title }</div>
                        { renderedControls }
                        { renderedButtons }
                    </div>
                </div>
            </div>
        </Draggable>
    );
}

ActivePlayerPrompt.displayName = "ActivePlayerPrompt";

export default ActivePlayerPrompt;
