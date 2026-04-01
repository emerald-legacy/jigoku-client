import { useState, useCallback, useRef, useEffect } from 'react';
import Messages from './Messages.jsx';

function Chat({ messages, onMouseOut, onMouseOver, sendMessage, visible }) {
    const messagePanelRef = useRef(null);
    const [canScroll, setCanScroll] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if(canScroll && messagePanelRef.current) {
            messagePanelRef.current.scrollTop = 999999;
        }
    }, [canScroll, messages]);

    const handleChange = useCallback((event) => {
        setMessage(event.target.value);
    }, []);

    const handleKeyPress = useCallback((event) => {
        if(event.key === 'Enter') {
            sendMessage(message);
            setMessage('');

            event.preventDefault();
        }
    }, [message, sendMessage]);

    const handleScroll = useCallback(() => {
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
    }, []);

    const classes = 'chat' + (visible ? '' : ' collapsed');

    return (
        <div className={ classes }>
            <div className="messages panel" ref={ messagePanelRef } onScroll={ handleScroll }>
                <Messages
                    messages={ messages }
                    onCardMouseOver={ onMouseOver }
                    onCardMouseOut={ onMouseOut }
                />
            </div>
            <form>
                <input
                    className="form-control"
                    placeholder='Chat...'
                    onKeyPress={ handleKeyPress }
                    onChange={ handleChange }
                    value={ message }
                />
            </form>
        </div>
    );
}

Chat.displayName = 'Chat';

export default Chat;
