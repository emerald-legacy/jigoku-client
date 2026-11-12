import React, { memo, useCallback, useLayoutEffect, useRef } from "react";
// @ts-expect-error - emoji-js has no type definitions
import EmojiConvertor from "emoji-js";
import { CheckCircle, Info, AlertCircle, AlertTriangle } from "lucide-react";
import Avatar from "../Avatar";
import { resolveFateImage, resolveHonorImage } from "../boardCosmetics";
import { usePatronViewerConfig } from "../PatronContext";
import { PatronName } from "../PatronName";
import { asset } from "../assetUrl";
import type { GameMessage, MessageFragment } from "../types/game";
import { iconsClan, iconsConflict, iconsElement, isCountedIcon } from "./messageIcons";

const otherIcons: Record<string, { className: string; imageSrc: string }> = {
    fate: { className: "icon-fate", imageSrc: asset("tokens/fate.webp") },
    honor: { className: "icon-honor", imageSrc: asset("tokens/honor.webp") },
    card: { className: "icon-card", imageSrc: asset("cardbacks/conflictcardback.webp") },
    cards: { className: "icon-card", imageSrc: asset("cardbacks/conflictcardback.webp") }
};

const emoji = new EmojiConvertor();

interface InnerMessagesProps {
    messages?: GameMessage[];
    onCardMouseOut?: (fragment: MessageFragment) => void;
    onCardMouseOver?: (fragment: MessageFragment) => void;
}

type MessageInput = MessageFragment | string | number | null | undefined | MessageInput[];

interface FormatContext {
    patronIconSrc: Record<string, string>;
    onMouseOver: (fragment: MessageFragment) => void;
    onMouseOut: (fragment: MessageFragment) => void;
}

function formatMessageText(message: MessageInput, ctx: FormatContext): React.ReactNode {
    if(!Array.isArray(message)) {
        if(message === null || message === undefined) {
            return "";
        }
        if(typeof message === "string") {
            return emoji.replace_colons(message);
        }
        if(typeof message === "number") {
            return message;
        }
        message = [message];
    }

    let index = 0;
    return message.map((rawFragment: MessageInput, fragmentIndex: number, fragments: MessageInput[]): React.ReactNode => {
        if(rawFragment === null || rawFragment === undefined) {
            return "";
        }

        if(typeof rawFragment === "string" && iconsConflict.includes(rawFragment)) {
            return (
                <span className={ `icon-${rawFragment}` } key={ index++ }>
                    <span className="hide-text">{ rawFragment }</span>
                </span>
            );
        }
        if(typeof rawFragment === "string" && iconsElement.includes(rawFragment)) {
            return (
                <span className={ `icon-element-${rawFragment}` } key={ index++ }>
                    <span className="hide-text">{ rawFragment }</span>
                </span>
            );
        }
        if(typeof rawFragment === "string" && iconsClan.includes(rawFragment)) {
            return (
                <span className={ `icon-clan-${rawFragment}` } key={ index++ }>
                    <span className="hide-text">{ rawFragment }</span>
                </span>
            );
        }
        if(typeof rawFragment === "string" && isCountedIcon(fragments, fragmentIndex)) {
            return (
                <img
                    className={ otherIcons[rawFragment].className }
                    key={ index++ }
                    title={ rawFragment }
                    src={ ctx.patronIconSrc[rawFragment] || otherIcons[rawFragment].imageSrc }
                />
            );
        }
        if(typeof rawFragment === "string") {
            return emoji.replace_colons(rawFragment);
        }
        if(typeof rawFragment === "number") {
            return rawFragment;
        }
        if(Array.isArray(rawFragment)) {
            return formatMessageText(rawFragment, ctx);
        }

        const fragment = rawFragment as MessageFragment;

        if(fragment.alert) {
            const alertMessage = formatMessageText(fragment.alert.message, ctx);

            switch(fragment.alert.type) {
                case "endofround":
                    return (
                        <div className="separator" key={ index++ }>
                            <hr />
                            { alertMessage }
                            <hr />
                        </div>
                    );
                case "success":
                    return (
                        <div className="alert alert-success" key={ index++ }>
                            <CheckCircle size={ 14 } style={ { display: "inline", verticalAlign: "text-bottom" } } />
                                &nbsp;
                            { alertMessage }
                        </div>
                    );
                case "info":
                    return (
                        <div className="alert alert-info" key={ index++ }>
                            <Info size={ 14 } style={ { display: "inline", verticalAlign: "text-bottom" } } />
                                &nbsp;
                            { alertMessage }
                        </div>
                    );
                case "danger":
                    return (
                        <div className="alert alert-danger" key={ index++ }>
                            <AlertCircle size={ 14 } style={ { display: "inline", verticalAlign: "text-bottom" } } />
                                &nbsp;
                            { alertMessage }
                        </div>
                    );
                case "warning":
                    return (
                        <div className="alert alert-warning" key={ index++ }>
                            <AlertTriangle size={ 14 } style={ { display: "inline", verticalAlign: "text-bottom" } } />
                                &nbsp;
                            { alertMessage }
                        </div>
                    );
            }
            return alertMessage;
        } else if(fragment.message) {
            return formatMessageText(fragment.message, ctx);
        } else if(fragment.emailHash) {
            return (
                <div key={ index++ }>
                    <Avatar
                        emailHash={ fragment.emailHash }
                        forceDefault={ fragment.noAvatar }
                        float
                    />
                    <span key={ index++ }>
                        <b><PatronName name={ fragment.name } /></b>
                    </span>
                </div>
            );
        } else if(fragment.id) {
            if(fragment.type === "ring") {
                return formatMessageText(["the ", fragment.element, " ring"], ctx);
            } else if(fragment.type === "player") {
                return <PatronName key={ index++ } name={ fragment.name } />;
            }
            if(fragment.type === "") {
                return fragment.label;
            }
            return (
                <span
                    key={ index++ }
                    className="card-link"
                    onMouseOver={ () => ctx.onMouseOver(fragment) }
                    onMouseOut={ () => ctx.onMouseOut(fragment) }
                >
                    { fragment.name }
                </span>
            );
        } else if(fragment.isReactComponent) {
            return fragment as React.ReactElement;
        } else if(typeof fragment === "object" && fragment.name) {
            // Handle objects with a name property (players, cards without id, etc.)
            return fragment.name;
        } else if(typeof fragment === "object") {
            // Last resort: try to stringify the object for debugging
            console.warn("Unhandled message fragment:", fragment);
            return JSON.stringify(fragment);
        }
        return "";
    });
}

interface MessageRowProps {
    text: MessageInput;
    fateSrc: string;
    honorSrc: string;
    onMouseOver: (fragment: MessageFragment) => void;
    onMouseOut: (fragment: MessageFragment) => void;
}

// A row only re-renders when its own message changes, not every time the log grows.
const MessageRow = memo(function MessageRow({ text, fateSrc, honorSrc, onMouseOver, onMouseOut }: MessageRowProps) {
    const ctx = { patronIconSrc: { fate: fateSrc, honor: honorSrc }, onMouseOver, onMouseOut };
    return <div className="message">{ formatMessageText(text, ctx) }</div>;
});

function InnerMessages({ messages, onCardMouseOut, onCardMouseOver }: InnerMessagesProps) {
    const highlightedCardIdRef = useRef<string | null>(null);
    const viewer = usePatronViewerConfig();
    const fateSrc = resolveFateImage(viewer);
    const honorSrc = resolveHonorImage(viewer);

    // The handlers read the latest props through a ref, so they stay the same across
    // renders and don't make every memoised row re-render.
    const cardHandlersRef = useRef({ onCardMouseOver, onCardMouseOut });
    useLayoutEffect(() => {
        cardHandlersRef.current = { onCardMouseOver, onCardMouseOut };
    });

    const handleMouseOver = useCallback((fragment: MessageFragment) => {
        const highlightedElement = highlightedCardIdRef.current ? document.getElementById(highlightedCardIdRef.current) : null;
        if(highlightedCardIdRef.current && highlightedElement) {
            highlightedElement.classList.remove("highlight");
        }

        const element = document.getElementById(fragment.uuid);

        if(element) {
            element.classList.add("highlight");
            highlightedCardIdRef.current = fragment.uuid;
        }

        cardHandlersRef.current.onCardMouseOver?.(fragment);
    }, []);

    const handleMouseOut = useCallback((fragment: MessageFragment) => {
        const element = document.getElementById(fragment.uuid);

        if(element) {
            element.classList.remove("highlight");
        }

        cardHandlersRef.current.onCardMouseOut?.(fragment);
    }, []);

    const getMessage = () => {
        // Keyed by the server's timestamp, counting repeats so several messages landing in the
        // same millisecond stay distinct. Keys then survive the log growing underneath them.
        const seenAt = new Map<string, number>();

        return messages?.map((message: GameMessage) => {
            const stamp = String(message.date ?? "");
            const occurrence = (seenAt.get(stamp) ?? 0) + 1;
            seenAt.set(stamp, occurrence);

            return (
                <MessageRow
                    key={ `${stamp}#${occurrence}` }
                    text={ message.message }
                    fateSrc={ fateSrc }
                    honorSrc={ honorSrc }
                    onMouseOver={ handleMouseOver }
                    onMouseOut={ handleMouseOut }
                />
            );
        });
    };

    return <div>{ getMessage() }</div>;
}

InnerMessages.displayName = "Messages";

export default InnerMessages;
export { InnerMessages };
