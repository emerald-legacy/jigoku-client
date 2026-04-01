import { useRef } from 'react';
import EmojiConvertor from 'emoji-js';
import { CheckCircle, Info, AlertCircle, AlertTriangle } from 'lucide-react';
import Avatar from '../Avatar.jsx';

const iconsConflict = ['military', 'political'];

const iconsElement = ['air', 'earth', 'fire', 'water', 'void'];

const iconsClan = ['crab', 'crane', 'dragon', 'lion', 'phoenix', 'scorpion', 'unicorn'];

const otherIcons = {
    fate: { className: 'icon-fate', imageSrc: '/img/Fate.png' },
    honor: { className: 'icon-honor', imageSrc: '/img/Honor.png' },
    card: { className: 'icon-card', imageSrc: '/img/cards/conflictcardback.png' },
    cards: { className: 'icon-card', imageSrc: '/img/cards/conflictcardback.png' }
};

const emoji = new EmojiConvertor();

function InnerMessages({ messages, onCardMouseOut, onCardMouseOver }) {
    const highlightedCardIdRef = useRef(null);

    const handleMouseOver = (fragment) => {
        const highlightedElement = document.getElementById(highlightedCardIdRef.current);
        if(highlightedCardIdRef.current && highlightedElement) {
            highlightedElement.classList.remove('highlight');
        }

        const element = document.getElementById(fragment.uuid);

        if(element) {
            element.classList.add('highlight');
            highlightedCardIdRef.current = fragment.uuid;
        }

        if(onCardMouseOver) {
            onCardMouseOver(fragment);
        }
    };

    const handleMouseOut = (fragment) => {
        const element = document.getElementById(fragment.uuid);

        if(element) {
            element.classList.remove('highlight');
        }

        if(onCardMouseOut) {
            onCardMouseOut(fragment);
        }
    };

    const formatMessageText = (message) => {
            // Handle non-array messages (strings, numbers, etc.)
            if(!Array.isArray(message)) {
                if(message === null || message === undefined) {
                    return '';
                }
                if(typeof message === 'string') {
                    return emoji.replace_colons(message);
                }
                if(typeof message === 'number') {
                    return message;
                }
                // Wrap single object in array to process it
                message = [message];
            }

            let index = 0;
            return message.map((fragment, key) => {
                if(fragment === null || fragment === undefined) {
                    return '';
                }

                if(fragment.alert) {
                    const alertMessage = formatMessageText(fragment.alert.message);

                    switch(fragment.alert.type) {
                        case 'endofround':
                            return (
                                <div className="separator" key={ index++ }>
                                    <hr />
                                    { alertMessage }
                                    <hr />
                                </div>
                            );
                        case 'success':
                            return (
                                <div className="alert alert-success" key={ index++ }>
                                    <CheckCircle size={ 14 } style={ { display: 'inline', verticalAlign: 'text-bottom' } } />
                                    &nbsp;
                                    { alertMessage }
                                </div>
                            );
                        case 'info':
                            return (
                                <div className="alert alert-info" key={ index++ }>
                                    <Info size={ 14 } style={ { display: 'inline', verticalAlign: 'text-bottom' } } />
                                    &nbsp;
                                    { alertMessage }
                                </div>
                            );
                        case 'danger':
                            return (
                                <div className="alert alert-danger" key={ index++ }>
                                    <AlertCircle size={ 14 } style={ { display: 'inline', verticalAlign: 'text-bottom' } } />
                                    &nbsp;
                                    { alertMessage }
                                </div>
                            );
                        case 'warning':
                            return (
                                <div className="alert alert-warning" key={ index++ }>
                                    <AlertTriangle size={ 14 } style={ { display: 'inline', verticalAlign: 'text-bottom' } } />
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
                    if(fragment.type === 'ring') {
                        return formatMessageText(['the ', fragment.element, ' ring']);
                    } else if(fragment.type === 'player') {
                        return fragment.name;
                    }
                    if(fragment.type === '') {
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
                } else if(iconsConflict.includes(fragment)) {
                    return (
                        <span className={ `icon-${fragment}` } key={ index++ }>
                            <span className="hide-text">{ fragment }</span>
                        </span>
                    );
                } else if(iconsElement.includes(fragment)) {
                    return (
                        <span className={ `icon-element-${fragment}` } key={ index++ }>
                            <span className="hide-text">{ fragment }</span>
                        </span>
                    );
                } else if(iconsClan.includes(fragment)) {
                    return (
                        <span className={ `icon-clan-${fragment}` } key={ index++ }>
                            <span className="hide-text">{ fragment }</span>
                        </span>
                    );
                } else if(otherIcons[fragment]) {
                    return (
                        <img
                            className={ otherIcons[fragment].className }
                            key={ index++ }
                            title={ fragment }
                            src={ otherIcons[fragment].imageSrc }
                        />
                    );
                } else if(typeof fragment === 'string') {
                    return emoji.replace_colons(fragment);
                } else if(fragment.isReactComponent) {
                    return fragment;
                } else if(typeof fragment === 'number') {
                    return fragment;
                } else if(Array.isArray(fragment)) {
                    // Handle nested arrays
                    return formatMessageText(fragment);
                } else if(typeof fragment === 'object' && fragment.name) {
                    // Handle objects with a name property (players, cards without id, etc.)
                    return fragment.name;
                } else if(typeof fragment === 'object') {
                    // Last resort: try to stringify the object for debugging
                    console.warn('Unhandled message fragment:', fragment);
                    return JSON.stringify(fragment);
                }
                return '';
            });
    };

    const getMessage = () => {
        return messages?.map((message, index) => {
            return (
                <div key={ `message${index}` } className="message">
                    { formatMessageText(message.message) }
                </div>
            );
        });
    };

    return <div>{ getMessage() }</div>;
}

InnerMessages.displayName = 'Messages';

export default InnerMessages;
export { InnerMessages };
