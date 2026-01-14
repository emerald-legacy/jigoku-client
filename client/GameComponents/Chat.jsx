import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import Messages from './Messages.jsx';
import $ from 'jquery';

class Chat extends React.Component {
    constructor () {
        super();

        this.messagePanelRef = createRef();
        this.onChange = this.onChange.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onScroll = this.onScroll.bind(this);

        this.state = {
            canScroll: true,
            message: ''
        };
    }

    componentDidUpdate() {
        if(this.state.canScroll && this.messagePanelRef.current) {
            $(this.messagePanelRef.current).scrollTop(999999);
        }
    }

    onChange(event) {
        this.setState({ message: event.target.value });
    }

    onKeyPress(event) {
        if(event.key === 'Enter') {
            this.props.sendMessage(this.state.message);
            this.setState({ message: '' });

            event.preventDefault();
        }
    }

    onScroll() {
        let messages = this.messagePanelRef.current;
        if(!messages) {
            return;
        }

        setTimeout(() => {
            if(messages.scrollTop >= messages.scrollHeight - messages.offsetHeight - 20) {
                this.setState({ canScroll: true });
            } else {
                this.setState({ canScroll: false });
            }
        }, 500);
    }

    render() {
        let classes = 'chat' + (this.props.visible ? '' : ' collapsed');

        return (
            <div className={ classes }>
                <div className='messages panel' ref={this.messagePanelRef} onScroll={ this.onScroll }>
                    <Messages
                        messages={ this.props.messages }
                        onCardMouseOver={ this.props.onMouseOver }
                        onCardMouseOut={ this.props.onMouseOut }
                    />
                </div>
                <form>
                    <input
                        className='form-control'
                        placeholder='Chat...'
                        onKeyPress={ this.onKeyPress }
                        onChange={ this.onChange }
                        value={ this.state.message }
                    />
                </form>
            </div>
        );
    }
}

Chat.displayName = 'Chat';
Chat.propTypes = {
    messages: PropTypes.array,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    sendMessage: PropTypes.func,
    visible: PropTypes.bool
};

export default Chat;
