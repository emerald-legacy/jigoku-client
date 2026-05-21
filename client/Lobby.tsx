import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import type { RootState } from "./types/redux";

import { X, Menu } from "lucide-react";
import * as actions from "./actions";
import Avatar from "./Avatar";
import News from "./SiteComponents/News";
import AlertPanel from "./SiteComponents/AlertPanel";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks";
import { loadServerVersion } from "./ReduxActions/serverVersion";
import type { OnlineUser } from "./types/game";
import type { NewsItem } from "./types/redux";

interface InnerLobbyProps {
    bannerNotice?: string;
    loadNews?: (opts: { limit?: number; forceLoad?: boolean }) => void;
    loading?: boolean;
    news?: NewsItem[];
    users?: OnlineUser[];
}

export function InnerLobby({ bannerNotice, loadNews, loading, news, users }: InnerLobbyProps) {
    const [showUsers, setShowUsers] = useState(false);
    const dispatch = useAppDispatch();
    const serverVersions = useAppSelector(state => state.serverVersion.nodes);

    useEffect(() => {
        loadNews?.({ limit: 3 });
    }, [loadNews]);

    useEffect(() => {
        dispatch(loadServerVersion());
    }, [dispatch]);

    const handleBurgerClick = () => {
        setShowUsers(prev => !prev);
    };

    let userList: React.ReactNode[];
    if(!users) {
        userList = [];
    } else {
        userList = users.map((user: OnlineUser) => (
            <div className="user-row" key={ user.name }>
                <Avatar emailHash={ user.emailHash } forceDefault={ user.noAvatar } />
                <span>{ user.name }</span>
            </div>
        ));
    }

    return (
        <div className="flex-container">
            <div className={ `sidebar${showUsers ? " expanded" : ""}` }>
                { showUsers ? (
                    <div>
                        <a href="#" className="btn pull-right" onClick={ handleBurgerClick }>
                            <X size={ 16 } />
                        </a>
                        <div className="userlist">Online Users
                            { userList }
                        </div>
                    </div>
                ) : (
                    <div>
                        <a href="#" className="btn" onClick={ handleBurgerClick }>
                            <Menu size={ 16 } />
                        </a>
                    </div>
                ) }
            </div>
            <div className="col-sm-offset-1 col-sm-10">
                <div className="main-header">
                    <span className="text-center">
                        <h1>Emerald Legacy</h1>
                        <span className="lobby-version">Client: { __BUILD_VERSION__ }{ serverVersions.map(node => ` | ${node.name}: ${node.version}`).join("") }</span>
                    </span>
                </div>
            </div>
            { bannerNotice ? <AlertPanel message={ bannerNotice } type="error" /> : null }
            <div className="col-sm-offset-1 col-sm-10">
                <div className="panel-title text-center">Getting Started</div>
                <div className="panel panel-darker">
                    <p>This site allows you to play Emerald Legacy in your browser. If you're new, head on over to the <Link to="/how-to-play">How To Play guide</Link> for a thorough explanation on how to use the site!</p>
                </div>
            </div>

            <div className="col-sm-offset-1 col-sm-10">
                <div className="panel-title text-center">
                    Latest site news
                </div>
                <div className="panel panel-darker">
                    { loading ? <div>News loading...</div> : null }
                    <News news={ news?.map((item) => ({ datePublished: typeof item.datePublished === "string" ? item.datePublished : (item.datePublished?.toISOString() ?? ""), text: item.text })) } />
                </div>
            </div>

            <div className="col-sm-offset-1 col-sm-10 chat-container">
                <div className="panel-title text-center">Community Information</div>
                <div className="panel panel-darker">
                    <div className="discord-grid">
                        <div className="discord-grid-cell">
                            <div className="discord-label">
                                <img src="/img/community_discord_icon.gif" className="discord-server-icon" />
                                <h3>L5R Community Discord Server</h3>
                            </div>
                            <p><a href="https://discord.gg/zPvBePb" target="_blank" rel="noreferrer">Invite Link</a></p>
                            <p>Are you interested in the L5R LCG?  Come and chat on our Discord server!</p>
                            <p>The server was created by members of the L5R community, and is maintained by the community, so come and talk any thing L5R related.</p>
                        </div>
                        <div className="discord-grid-cell">
                            <div className="discord-label">
                                <img src="/img/event_discord_icon.webp" className="discord-server-icon" />
                                <h3>L5R Event Discord Server</h3>
                            </div>
                            <p><a href="https://discord.gg/mfpZTqxxah" target="_blank" rel="noreferrer">Invite Link</a></p>
                            <p>This Discord server is used by the community to coordinate community run events.</p>
                            <p>Whether you want to play in a sanctioned Emerald Legacy tournament, join the monthly Discord League, or find fellow beginners in the Beginner's League, this server has something for everyone, not just competitive players.</p>
                        </div>
                    </div>

                    <div className="emerald-legacy-panel">
                        <img className="emerald-legacy-logo" src="/img/emerald-legacy-logo.png" />
                        <h3><a href="https://emeraldlegacy.org/" target="_blank" rel="noreferrer">Emerald Legacy</a></h3>
                        <p>The Emerald Legacy project is a fan-run nonprofit volunteer collective. Its mission is to provide a living and thriving continuation of the LCG after the end of official support for the game.
                        Emerald Legacy is responsible for creating and releasing new cards, organizing tournaments, and maintaining the rules and balance of the game.</p>
                        <br />
                        <p>Emerald Legacy provides the <a href="https://www.emeralddb.org/" target="_blank" rel="noreferrer">EmeraldDB</a> service, which is an online collection of all cards and rules for the LCG.
                        EmeraldDB includes a deck builder for the LCG, as well as lists that have been made public by other players.  Deck lists that you create are able to be directly imported into the Deckbuilder here!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

InnerLobby.displayName = "Lobby";

function mapStateToProps(state: RootState) {
    return {
        bannerNotice: state.chat.notice,
        loading: state.news.loading,
        news: state.news.news,
        users: state.games.users
    };
}

export default function Lobby() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    return <InnerLobby { ...props } { ...boundActions } />;
}
