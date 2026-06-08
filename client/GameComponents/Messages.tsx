import React, { useRef } from "react";
// @ts-expect-error - emoji-js has no type definitions
import EmojiConvertor from "emoji-js";
import { CheckCircle, Info, AlertCircle, AlertTriangle } from "lucide-react";
import Avatar from "../Avatar";
import { resolveFateImage, resolveHonorImage } from "../boardCosmetics";
import { usePatronViewerConfig } from "../PatronContext";
import { asset } from "../assetUrl";
import type { GameMessage, MessageFragment } from "../types/game";

const iconsConflict = ["military", "political"];

const iconsElement = ["air", "earth", "fire", "water", "void"];

const iconsClan = ["crab", "crane", "dragon", "lion", "phoenix", "scorpion", "unicorn"];

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

function InnerMessages({ messages, onCardMouseOut, onCardMouseOver }: InnerMessagesProps) {
    const highlightedCardIdRef = useRef<string | null>(null);
    const viewer = usePatronViewerConfig();
    const patronIconSrc: Record<string, string> = { fate: resolveFateImage(viewer), honor: resolveHonorImage(viewer) };

    const handleMouseOver = (fragment: MessageFragment) => {
        const highlightedElement = highlightedCardIdRef.current ? document.getElementById(highlightedCardIdRef.current) : null;
        if(highlightedCardIdRef.current && highlightedElement) {
            highlightedElement.classList.remove("highlight");
        }

        const element = document.getElementById(fragment.uuid);

        if(element) {
            element.classList.add("highlight");
            highlightedCardIdRef.current = fragment.uuid;
        }

        if(onCardMouseOver) {
            onCardMouseOver(fragment);
        }
    };

    const handleMouseOut = (fragment: MessageFragment) => {
        const element = document.getElementById(fragment.uuid);

        if(element) {
            element.classList.remove("highlight");
        }

        if(onCardMouseOut) {
            onCardMouseOut(fragment);
        }
    };

    const formatMessageText = (message: MessageInput): React.ReactNode => {
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
        return message.map((rawFragment: MessageInput, _key: number): React.ReactNode => {
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
            if(typeof rawFragment === "string" && otherIcons[rawFragment]) {
                return (
                    <img
                        className={ otherIcons[rawFragment].className }
                        key={ index++ }
                        title={ rawFragment }
                        src={ patronIconSrc[rawFragment] || otherIcons[rawFragment].imageSrc }
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
                return formatMessageText(rawFragment);
            }

            const fragment = rawFragment as MessageFragment;

            if(fragment.alert) {
                const alertMessage = formatMessageText(fragment.alert.message);

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
                return formatMessageText(fragment.message);
            } else if(fragment.emailHash) {
                return (
                    <div key={ index++ }>
                        <Avatar
                            emailHash={ fragment.emailHash }
                            forceDefault={ fragment.noAvatar }
                            float
                        />
                        <span key={ index++ }>
                            <b>{ fragment.name }</b>
                        </span>
                    </div>
                );
            } else if(fragment.id) {
                if(fragment.type === "ring") {
                    return formatMessageText(["the ", fragment.element, " ring"]);
                } else if(fragment.type === "player") {
                    return fragment.name;
                }
                if(fragment.type === "") {
                    return fragment.label;
                }
                return (
                    <span
                        key={ index++ }
                        className="card-link"
                        onMouseOver={ () => handleMouseOver(fragment) }
                        onMouseOut={ () => handleMouseOut(fragment) }
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
    };

    const getMessage = () => {
        return messages?.map((message: GameMessage, index: number) => {
            return (
                <div key={ `message${index}` } className="message">
                    { formatMessageText(message.message) }
                </div>
            );
        });
    };

    return <div>{ getMessage() }</div>;
}

InnerMessages.displayName = "Messages";

export default InnerMessages;
export { InnerMessages };
