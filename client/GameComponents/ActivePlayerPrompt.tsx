import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";

import AbilityTargeting from "./AbilityTargeting";
import CardNameLookup from "./CardNameLookup";
import type { Button, Card, Control } from "../types/game";
import type { User } from "../types/user";

interface ActivePlayerPromptProps {
    buttons?: Button[];
    cards?: Record<string, Card>;
    controls?: Control[];
    onButtonClick?: (command: string | undefined, arg: string | undefined, uuid: string | undefined, method: string | undefined) => void;
    onMouseOut?: (card: Card) => void;
    onMouseOver?: (card: Card) => void;
    onTimerExpired?: (button?: Button) => void;
    onTitleClick?: () => void;
    phase?: string;
    promptTitle?: string;
    title?: string;
    user?: User;
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
    // Resolution is tracked per prompt occurrence, i.e. per `buttons` array identity: each
    // gamestate push brings a new array, so the same prompt offered twice (a card whose
    // ability gained an additional use) gets its own timer instead of inheriting the first
    // one's resolved state. Re-renders keep the array, so a running timer is not restarted.
    const [progress, setProgress] = useState<{ buttons?: Button[]; timerClass: string; timeLeft: number } | null>(null);
    const [resolvedButtons, setResolvedButtons] = useState<Button[] | undefined>(undefined);
    // "I need more time" is an explicit request, so it sticks until the prompt itself changes.
    const [cancelledPromptKey, setCancelledPromptKey] = useState<string | null>(null);

    const timerRef = useRef<{ started: Date | null; timerTime: number }>({ started: null, timerTime: 0 });
    const timerHandleRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onTimerExpiredRef = useRef(onTimerExpired);
    const draggableRef = useRef<HTMLDivElement | null>(null);

    const timerButton = buttons?.find((button: Button) => button.timer);
    const hasTimerButton = !!timerButton;
    const timerButtonRef = useRef(timerButton);
    const buttonsRef = useRef(buttons);
    const windowTimer = user?.settings?.windowTimer;
    const promptKey = JSON.stringify(buttons?.map((button: Button) => [button.command, button.arg, button.uuid, button.text, button.timer]) ?? []);

    const showTimer = hasTimerButton && !!windowTimer && cancelledPromptKey !== promptKey && resolvedButtons !== buttons;
    const timerClass = progress && progress.buttons === buttons ? progress.timerClass : "100%";
    const timeLeft = progress && progress.buttons === buttons ? progress.timeLeft : Number(windowTimer ?? 0);

    useEffect(() => {
        onTimerExpiredRef.current = onTimerExpired;
    }, [onTimerExpired]);

    useEffect(() => {
        timerButtonRef.current = timerButton;
    }, [timerButton]);

    useEffect(() => {
        buttonsRef.current = buttons;
    }, [buttons]);

    useEffect(() => {
        if(!showTimer || !windowTimer) {
            return;
        }

        timerRef.current.started = new Date();
        timerRef.current.timerTime = windowTimer;

        const handle = setInterval(() => {
            const now = new Date();
            const startedAt = timerRef.current.started ? timerRef.current.started.getTime() : now.getTime();
            const difference = (now.getTime() - startedAt) / 1000;

            if(difference >= timerRef.current.timerTime) {
                clearInterval(handle);
                timerHandleRef.current = null;
                setResolvedButtons(buttonsRef.current);

                if(onTimerExpiredRef.current) {
                    onTimerExpiredRef.current(timerButtonRef.current);
                }
                return;
            }

            setProgress({
                buttons: buttonsRef.current,
                timerClass: `${(((timerRef.current.timerTime - difference) / timerRef.current.timerTime) * 100).toFixed()}%`,
                timeLeft: Number((timerRef.current.timerTime - difference).toFixed())
            });
        }, 100);

        timerHandleRef.current = handle;

        return () => {
            clearInterval(handle);
            timerHandleRef.current = null;
        };
    }, [promptKey, showTimer, windowTimer]);

    const handleButtonClick = (event: React.MouseEvent, command: string | undefined, arg: string | undefined, uuid: string | undefined, method: string | undefined) => {
        event.preventDefault();

        if(timerHandleRef.current) {
            clearInterval(timerHandleRef.current);
            timerHandleRef.current = null;
        }

        setResolvedButtons(buttons);

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

        setCancelledPromptKey(promptKey);
        setResolvedButtons(buttons);

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
            const source = control.source;
            const sourceKey = typeof source === "string" ? source : source?.uuid ?? source?.name ?? "";
            const controlKey = `${control.type}-${sourceKey}-${index}`;
            switch(control.type) {
                case "targeting": {
                    const targetingControl = control as unknown as Control & { source: { type?: string; name?: string }; targets: Array<{ type?: string; name?: string }> };
                    return (
                        <AbilityTargeting
                            key={ controlKey }
                            onMouseOut={ onMouseOut }
                            onMouseOver={ onMouseOver }
                            source={ targetingControl.source }
                            targets={ targetingControl.targets }
                        />
                    );
                }
                case "card-name":
                    return (
                        <CardNameLookup
                            key={ controlKey }
                            cards={ cards ?? {} }
                            onCardSelected={ (cardName: string | null) => handleCardNameSelected(control.command, control.uuid, control.method, cardName ?? "") }
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
