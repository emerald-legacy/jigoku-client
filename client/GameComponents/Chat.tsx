import React, { useState, useRef, useEffect } from "react";
import { Menu, AlertCircle, Wrench, Settings, Download } from "lucide-react";
import Messages from "./Messages";
import type { GameMessage, MessageFragment } from "../types/game";

interface ChatProps {
    messages: GameMessage[];
    onMouseOut?: (fragment: MessageFragment) => void;
    onMouseOver?: (fragment: MessageFragment) => void;
    sendMessage: (message: string) => void;
    visible?: boolean;
    manualModeEnabled?: boolean;
    showChatAlert?: boolean;
    showDownloadLog?: boolean;
    showManualMode?: boolean;
    onDownloadLogClick?: (event?: React.MouseEvent) => void;
    onManualModeClick?: (event?: React.MouseEvent) => void;
    onSettingsClick?: (event?: React.MouseEvent) => void;
    onToggleChatClick?: (event?: React.MouseEvent) => void;
}

function Chat({
    messages,
    onMouseOut,
    onMouseOver,
    sendMessage,
    visible,
    manualModeEnabled,
    showChatAlert,
    showDownloadLog,
    showManualMode,
    onDownloadLogClick,
    onManualModeClick,
    onSettingsClick,
    onToggleChatClick
}: ChatProps) {
    const messagePanelRef = useRef<HTMLDivElement>(null);
    const [canScroll, setCanScroll] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if(canScroll && messagePanelRef.current) {
            messagePanelRef.current.scrollTop = 999999;
        }
    }, [canScroll, messages]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if(event.key === "Enter") {
            sendMessage(message);
            setMessage("");
            event.preventDefault();
        }
    };

    const handleScroll = () => {
        const messagesEl = messagePanelRef.current;
        if(!messagesEl) {
            return;
        }
        setTimeout(() => {
            if(messagesEl.scrollTop >= messagesEl.scrollHeight - messagesEl.offsetHeight - 20) {
                setCanScroll(true);
            } else {
                setCanScroll(false);
            }
        }, 500);
    };

    return (
        <div className={ `chat-card${visible ? "" : " chat-card-collapsed"}` }>
            <div className="chat-card-body">
                <div className="chat-messages" ref={ messagePanelRef } onScroll={ handleScroll }>
                    <Messages
                        messages={ messages }
                        onCardMouseOver={ onMouseOver ? (f: MessageFragment) => onMouseOver(f) : undefined }
                        onCardMouseOut={ onMouseOut ? (f: MessageFragment) => onMouseOut(f) : undefined }
                    />
                </div>
                <form className="chat-input-row">
                    <input
                        className="chat-input"
                        placeholder="Chat..."
                        onKeyPress={ handleKeyPress }
                        onChange={ handleChange }
                        value={ message }
                    />
                </form>
            </div>
            <div className="chat-controls">
                <button
                    type="button"
                    className={ `chat-control-btn${showChatAlert ? " has-alert" : ""}` }
                    onClick={ onToggleChatClick }
                    title="Toggle chat"
                >
                    <Menu size={ 14 } />
                    <span className="chat-control-label">Toggle Chat</span>
                    { showChatAlert && <AlertCircle size={ 12 } className="chat-control-alert" /> }
                </button>
                { showManualMode && (
                    <button
                        type="button"
                        className={ `chat-control-btn${manualModeEnabled ? " manual" : ""}` }
                        onClick={ onManualModeClick }
                        title={ manualModeEnabled ? "Manual mode: on" : "Manual mode: off" }
                    >
                        <Wrench size={ 14 } />
                        <span className="chat-control-label">{ manualModeEnabled ? "Manual" : "Auto" }</span>
                    </button>
                ) }
                <button
                    type="button"
                    className="chat-control-btn"
                    onClick={ onSettingsClick }
                    title="Settings"
                >
                    <Settings size={ 14 } />
                    <span className="chat-control-label">Settings</span>
                </button>
                { showDownloadLog && (
                    <button
                        type="button"
                        className="chat-control-btn"
                        onClick={ onDownloadLogClick }
                        title="Download game log"
                    >
                        <Download size={ 14 } />
                        <span className="chat-control-label">Game Log</span>
                    </button>
                ) }
            </div>
        </div>
    );
}

Chat.displayName = "Chat";

export default Chat;
