import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import $ from 'jquery';
import EmojiConvertor from 'emoji-js';
import moment from 'moment';

import * as actions from './actions';
import Avatar from './Avatar.jsx';
import News from './SiteComponents/News.jsx';
import AlertPanel from './SiteComponents/AlertPanel.jsx';
import Link from './Link.jsx';

class InnerLobby extends React.Component {
    constructor() {
        super();

        this.onChange = this.onChange.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onSendClick = this.onSendClick.bind(this);
        this.onScroll = this.onScroll.bind(this);

        this.emoji = new EmojiConvertor();

        this.state = {
            canScroll: true,
            message: '',
            showUsers: false
        };
    }

    componentDidMount() {
        this.props.loadNews({ limit: 3 });
    }

    componentDidUpdate() {
        if(this.state.canScroll) {
            $(this.refs.messages).scrollTop(999999);
        }
    }

    sendMessage() {
        if(this.state.message === '') {
            return;
        }

        this.props.socket.emit('lobbychat', this.state.message);

        this.setState({ message: '' });
    }

    onKeyPress(event) {
        if(event.key === 'Enter') {
            this.sendMessage();

            this.refs.message.clear();

            event.preventDefault();
        }
    }

    onSendClick(event) {
        event.preventDefault();

        this.sendMessage();
    }

    onChange(value) {
        this.setState({ message: value });
    }

    onScroll() {
        let messages = this.refs.messages;

        setTimeout(() => {
            if(messages.scrollTop >= messages.scrollHeight - messages.offsetHeight - 20) {
                this.setState({ canScroll: true });
            } else {
                this.setState({ canScroll: false });
            }
        }, 500);
    }

    onBurgerClick() {
        this.setState({ showUsers: !this.state.showUsers });
    }

    getMessages() {
        let groupedMessages = {};
        let index = 0;
        let today = moment();
        let yesterday = moment().add(-1, 'days');
        let lastUser;
        let currentGroup = 0;

        _.each(this.props.messages, message => {
            if(!message.user) {
                return;
            }

            let formattedTime = moment(message.time).format('YYYYMMDDHHmm');
            if(lastUser && message.user && lastUser !== message.user.username) {
                currentGroup++;
            }

            let key = message.user.username + formattedTime + currentGroup;

            if(!groupedMessages[key]) {
                groupedMessages[key] = [];
            }

            groupedMessages[key].push(message);

            lastUser = message.user.username;
        });

        return _.map(groupedMessages, messages => {
            let timestamp = '';
            let firstMessage = _.first(messages);

            if(!firstMessage.user) {
                return;
            }

            if(today.isSame(firstMessage.time, 'd')) {
                timestamp = moment(firstMessage.time).format('H:mm');
            } else if(yesterday.isSame(firstMessage.time, 'd')) {
                timestamp = 'yesterday ' + moment(firstMessage.time).format('H:mm');
            } else {
                timestamp = moment(firstMessage.time).format('MMM Do H:mm');
            }

            let renderedMessages = _.map(messages, message => {
                if(!message.user) {
                    return;
                }
                return (<div className='lobby-message'>{ this.emoji.replace_colons(message.message) }</div>);
            });

            return (
                <div key={ timestamp + firstMessage.user.username + (index++).toString() }>
                    <Avatar emailHash={ firstMessage.user.emailHash } float forceDefault={ firstMessage.user.noAvatar } />
                    <span className='username'>{ firstMessage.user.username }</span><span>{ timestamp }</span>
                    { renderedMessages }
                </div>
            );
        });
    }

    render() {
        let userList = _.map(this.props.users, user => {
            return (
                <div className='user-row' key={ user.name }>
                    <Avatar emailHash={ user.emailHash } forceDefault={ user.noAvatar } />
                    <span>{ user.name }</span>
                </div>
            );
        });


        return (
            <div className='flex-container'>
                <div className={ 'sidebar' + (this.state.showUsers ? ' expanded' : '') }>
                    { this.state.showUsers ?
                        <div>
                            <a href='#' className='btn pull-right' onClick={ this.onBurgerClick.bind(this) }>
                                <span className='glyphicon glyphicon-remove' />
                            </a>
                            <div className='userlist'>Online Users
                                { userList }
                            </div>
                        </div> :
                        <div>
                            <a href='#' className='btn' onClick={ this.onBurgerClick.bind(this) }>
                                <span className='glyphicon glyphicon-menu-hamburger' />
                            </a>
                        </div>
                    }
                </div>
                <div className='col-sm-offset-1 col-sm-10'>
                    <div className='main-header'>
                        <span className='text-center'><h1>Legend of the Five Rings LCG</h1></span>
                    </div>
                </div>
                { this.props.bannerNotice ? <AlertPanel message={ this.props.bannerNotice } type='error' /> : null }
                <div className='col-sm-offset-1 col-sm-10'>
                    <div className='panel-title text-center'>Getting Started</div>
                    <div className='panel panel-darker'>
                        <p>This site allows you to play the Legend of the Five Rings LCG in your browser.</p>
                        <p>If you're new, head on over to the <Link href='/how-to-play'>How To Play guide</Link> for a thorough explanation on how to use the site!</p>
                    </div>
                </div>

                <div className='col-sm-offset-1 col-sm-10'>
                    <div className='panel-title text-center'>
                        Latest site news
                    </div>
                    <div className='panel panel-darker'>
                        { this.props.loading ? <div>News loading...</div> : null }
                        <News news={ this.props.news } />
                    </div>
                </div>

                <div className='col-sm-offset-1 col-sm-10 chat-container'>
                    <div className='panel-title text-center'>Community Information</div>
                    <div className='panel panel-darker'>
                        <div className='discord-grid'>
                            <div className='discord-grid-cell'>
                                <div className='discord-label'>
                                    <img src='/img/community_discord_icon.gif' className='discord-server-icon'/>
                                    <h3>L5R Community Discord Server</h3>
                                </div>
                                <p><a href='https://discord.gg/zPvBePb' target='_blank'>Invite Link</a></p>
                                <p>Are you interested in the L5R LCG?  Come and chat on our Discord server!</p>
                                <p>The server was created by members of the L5R community, and is maintained by the community, so come and talk any thing L5R related.</p>
                            </div>
                            <div className='discord-grid-cell'>
                                <div className='discord-label'>
                                    <img src='/img/event_discord_icon.webp' className='discord-server-icon'/>
                                    <h3>L5R Event Discord Server</h3>
                                </div>
                                <p><a href='https://discord.gg/mfpZTqxxah' target='_blank'>Invite Link</a></p>
                                <p>This Discord server is used by the community to coordinate community run events.</p>
                                <p>Whether you want to play in a sanctioned Emerald Legacy tournament, join the monthly Discord League, or find fellow beginners in the Beginner's League, this server has something for everyone, not just competitive players.</p>
                            </div>
                        </div>

                        <div className='emerald-legacy-panel'>
                            <img className='emerald-legacy-logo' src='/img/emerald-legacy-logo.png'/>
                            <h3><a href='https://emeraldlegacy.org/' target='_blank'>Emerald Legacy</a></h3>
                            <p>The Emerald Legacy project is a fan-run nonprofit volunteer collective. Its mission is to provide a living and thriving continuation of the LCG after the end of official support for the game.
                            Emerald Legacy is responsible for creating and releasing new cards, organizing tournaments, and maintaining the rules and balance of the game.</p>
                            <br />
                            <p>Emerald Legacy provides the <a href='https://www.emeralddb.org/' target='_blank'>EmeraldDB</a> service, which is an online collection of all cards and rules for the LCG.
                            EmeraldDB includes a deck builder for the LCG, as well as lists that have been made public by other players.  Deck lists that you create are able to be directly imported into the Deckbuilder here!</p>
                        </div>
                    </div>
                </div>
            </div>);
    }
}

InnerLobby.displayName = 'Lobby';
InnerLobby.propTypes = {
    bannerNotice: PropTypes.string,
    fetchNews: PropTypes.func,
    loadNews: PropTypes.func,
    loading: PropTypes.bool,
    messages: PropTypes.array,
    news: PropTypes.array,
    socket: PropTypes.object,
    users: PropTypes.array
};

function mapStateToProps(state) {
    return {
        bannerNotice: state.chat.notice,
        loading: state.api.loading,
        messages: state.chat.messages,
        news: state.news.news,
        newsLoading: state.news.newsLoading,
        socket: state.socket.socket,
        users: state.games.users
    };
}

const Lobby = connect(mapStateToProps, actions, null)(InnerLobby);

export default Lobby;
