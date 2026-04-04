import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";

import AbilityTargeting from "./AbilityTargeting.jsx";
import CardNameLookup from "./CardNameLookup.jsx";

// Deep equality check for objects
function isEqual(a, b) {
    if(a === b) {
        return true;
    }
    if(a === null || a === undefined || b === null || b === undefined) {
        return false;
    }
    if(typeof a !== "object" || typeof b !== "object") {
        return a === b;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if(keysA.length !== keysB.length) {
        return false;
    }

    for(const key of keysA) {
        if(!keysB.includes(key) || !isEqual(a[key], b[key])) {
            return false;
        }
    }

    return true;
}

function buttonsAreEqual(oldButtons, newButtons) {
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
}) {
    const [showTimer, setShowTimer] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerClass, setTimerClass] = useState("100%");
    const [timerCancelled, setTimerCancelled] = useState(false);

    const timerRef = useRef({ started: null, timerTime: 0 });
    const timerHandleRef = useRef(null);
    const prevButtonsRef = useRef(buttons);
    const draggableRef = useRef(null);

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

        const hasTimerButton = buttons?.some(button => button.timer);
        if(hasTimerButton) {
            if(timerHandleRef.current) {
                return;
            }

            timerRef.current.started = new Date();
            timerRef.current.timerTime = user.settings.windowTimer;

            const handle = setInterval(() => {
                const now = new Date();
                const difference = (now - timerRef.current.started) / 1000;

                if(difference >= timerRef.current.timerTime) {
                    clearInterval(timerHandleRef.current);
                    timerHandleRef.current = null;
                    setShowTimer(false);

                    if(onTimerExpired) {
                        onTimerExpired();
                    }
                    return;
                }

                const newTimerClass = `${(((timerRef.current.timerTime - difference) / timerRef.current.timerTime) * 100).toFixed()}%`;
                setTimerClass(newTimerClass);
                setTimeLeft((timerRef.current.timerTime - difference).toFixed());
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

    const handleButtonClick = (event, command, arg, uuid, method) => {
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

    const handleCancelTimerClick = (event, button) => {
        event.preventDefault();

        if(timerHandleRef.current) {
            clearInterval(timerHandleRef.current);
            timerHandleRef.current = null;
        }

        setShowTimer(false);
        setTimerCancelled(true);

        if(button.method) {
            onButtonClick(button.command, button.arg, button.uuid, button.method);
        }
    };

    const handleMouseOver = (event, card) => {
        if(card && onMouseOver) {
            onMouseOver(card);
        }
    };

    const handleMouseOut = (event, card) => {
        if(card && onMouseOut) {
            onMouseOut(card);
        }
    };

    const handleCardNameSelected = (command, uuid, method, cardName) => {
        if(onButtonClick) {
            onButtonClick(command, cardName, uuid, method);
        }
    };

    const renderedButtons = (() => {
        if(!buttons) {
            return [];
        }

        let buttonIndex = 0;
        const result = [];

        for(const button of buttons) {
            if(button.timer) {
                continue;
            }

            const clickCallback = button.timerCancel
                ? (event) => handleCancelTimerClick(event, button)
                : (event) => handleButtonClick(event, button.command, button.arg, button.uuid, button.method);

            const option = (
                <button
                    key={ button.command + buttonIndex.toString() }
                    className="btn btn-default"
                    onClick={ clickCallback }
                    onMouseOver={ (event) => handleMouseOver(event, button.card) }
                    onMouseOut={ (event) => handleMouseOut(event, button.card) }
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

        return controls.map((control, index) => {
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
                            onCardSelected={ (cardName) => handleCardNameSelected(control.command, control.uuid, control.method, cardName) }
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
