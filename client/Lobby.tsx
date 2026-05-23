import React, { useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import type { RootState } from "./types/redux";

import { MessageCircle, CalendarDays, Globe, BookOpen, ArrowUpRight, ScrollText, Compass, Castle } from "lucide-react";
import * as actions from "./actions";
import News from "./SiteComponents/News";
import AlertPanel from "./SiteComponents/AlertPanel";
import SamuraiSidebar from "./components/SamuraiSidebar/SamuraiSidebar";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks";
import { loadServerVersion } from "./ReduxActions/serverVersion";
import type { NewsItem } from "./types/redux";

interface InnerLobbyProps {
    bannerNotice?: string;
    loadNews?: (opts: { limit?: number; forceLoad?: boolean }) => void;
    loading?: boolean;
    news?: NewsItem[];
}

interface CommunityLink {
    href: string;
    title: string;
    blurb: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    glyph: string;
}

const COMMUNITY_LINKS: CommunityLink[] = [
    {
        href: "https://discord.gg/zPvBePb",
        title: "L5R Community Discord",
        blurb: "Players, rules questions, finding a game.",
        icon: MessageCircle,
        glyph: "話"
    },
    {
        href: "https://discord.gg/mfpZTqxxah",
        title: "L5R Event Discord",
        blurb: "Sanctioned events, monthly league, beginners.",
        icon: CalendarDays,
        glyph: "戦"
    },
    {
        href: "https://emeraldlegacy.org/",
        title: "Emerald Legacy",
        blurb: "The volunteer collective continuing the LCG.",
        icon: Globe,
        glyph: "翠"
    },
    {
        href: "https://www.emeralddb.org/",
        title: "EmeraldDB",
        blurb: "Card database, rules, deckbuilder.",
        icon: BookOpen,
        glyph: "書"
    }
];

export function InnerLobby({ bannerNotice, loadNews, loading, news }: InnerLobbyProps) {
    const dispatch = useAppDispatch();
    const serverVersions = useAppSelector(state => state.serverVersion.nodes);

    useEffect(() => {
        loadNews?.({ limit: 10 });
    }, [loadNews]);

    useEffect(() => {
        dispatch(loadServerVersion());
    }, [dispatch]);

    const newsForList = news?.map((item) => ({
        datePublished: typeof item.datePublished === "string" ? item.datePublished : (item.datePublished?.toISOString() ?? ""),
        text: item.text
    }));

    return (
        <div className="flex-container">
            <SamuraiSidebar />

            <div className="lobby-page">
                <header className="lobby-hero">
                    <div className="lobby-hero-rings" aria-hidden="true">
                        <span className="ring ring-earth" />
                        <span className="ring ring-water" />
                        <span className="ring ring-fire" />
                        <span className="ring ring-air" />
                        <span className="ring ring-void" />
                    </div>
                    <img src="/img/emerald-legacy-logo.png" alt="Emerald Legacy" className="lobby-hero-logo" />
                    <p className="lobby-hero-tagline">
                        Play the Legend of the Five Rings LCG and Emerald Legacy in your browser.
                    </p>
                    <p className="lobby-hero-meta">
                        Client { __BUILD_VERSION__ }
                        { serverVersions.map(node => (
                            <span key={ node.name }> &nbsp;&middot;&nbsp; { node.name } { node.version }</span>
                        )) }
                    </p>
                    <span className="lobby-hero-seal" aria-hidden="true">獺</span>
                </header>

                { bannerNotice ? <AlertPanel message={ bannerNotice } type="error" /> : null }

                <div className="row lobby-grid">
                    <div className="col-sm-8 lobby-col-news">
                        <section className="lobby-section">
                            <div className="panel-title">
                                <ScrollText size={ 16 } className="panel-title-icon" />
                                <span>Dispatches</span>
                                <span className="panel-title-meta">Latest site news</span>
                            </div>
                            <div className="panel panel-darker lobby-panel-news">
                                { loading ? (
                                    <div className="lobby-news-loading">Unfurling the scroll&hellip;</div>
                                ) : (
                                    <div className="lobby-news-scroll">
                                        <News news={ newsForList } />
                                    </div>
                                ) }
                            </div>
                        </section>
                    </div>

                    <div className="col-sm-4 lobby-col-side">
                        <section className="lobby-section">
                            <div className="panel-title">
                                <Compass size={ 16 } className="panel-title-icon" />
                                <span>First Steps</span>
                            </div>
                            <div className="panel panel-darker">
                                <p className="lobby-start-body">
                                    New to the table? The <Link to="/how-to-play" className="lobby-inline-link">How to Play</Link> guide walks you through every move &mdash; from building a deck to closing your first conflict.
                                </p>
                            </div>
                        </section>

                        <section className="lobby-section">
                            <div className="panel-title">
                                <Castle size={ 16 } className="panel-title-icon" />
                                <span>The Gates</span>
                            </div>
                            <div className="panel panel-darker lobby-panel-gates">
                                <ul className="lobby-link-list">
                                    { COMMUNITY_LINKS.map(link => {
                                        const Icon = link.icon;
                                        return (
                                            <li key={ link.href }>
                                                <a href={ link.href } target="_blank" rel="noreferrer" className="lobby-link-row">
                                                    <span className="lobby-link-mon" aria-hidden="true">{ link.glyph }</span>
                                                    <span className="lobby-link-text">
                                                        <span className="lobby-link-title">
                                                            <Icon size={ 13 } className="lobby-link-icon" />
                                                            { link.title }
                                                        </span>
                                                        <span className="lobby-link-blurb">{ link.blurb }</span>
                                                    </span>
                                                    <ArrowUpRight size={ 14 } className="lobby-link-chevron" />
                                                </a>
                                            </li>
                                        );
                                    }) }
                                </ul>
                            </div>
                        </section>
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
        news: state.news.news
    };
}

export default function Lobby() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    return <InnerLobby { ...props } { ...boundActions } />;
}
