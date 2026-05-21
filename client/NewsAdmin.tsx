import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { format } from "date-fns";
import { ScrollText, Feather } from "lucide-react";

import AlertPanel from "./SiteComponents/AlertPanel";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState, NewsItem } from "./types/redux";

interface InnerNewsAdminProps {
    addNews: (text: string) => void;
    apiError?: string;
    clearNewsStatus: () => void;
    loadNews: (opts: { forceLoad: boolean }) => void;
    loading?: boolean;
    news?: NewsItem[];
    newsSaved?: boolean;
}

export function InnerNewsAdmin({ addNews, apiError, clearNewsStatus, loadNews, loading, news, newsSaved }: InnerNewsAdminProps) {
    const [newsText, setNewsText] = useState("");

    useEffect(() => {
        loadNews({ forceLoad: true });
    }, [loadNews]);

    useEffect(() => {
        if(newsSaved) {
            const timer = setTimeout(() => {
                clearNewsStatus();
            }, 5000);
            loadNews({ forceLoad: true });
            return () => clearTimeout(timer);
        }
    }, [newsSaved, clearNewsStatus, loadNews]);

    const onNewsTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewsText(event.target.value);
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const text = newsText.trim();
        if(!text) {
            return;
        }
        addNews(text);
        setNewsText("");
    };

    const canSubmit = newsText.trim().length > 0;

    return (
        <div className="news-admin">
            { newsSaved ? <AlertPanel message="Dispatch published." type="success" /> : null }
            { apiError ? <AlertPanel type="error" message={ apiError } /> : null }

            <div className="row">
                <div className="col-sm-7">
                    <div className="panel-title">
                        <Feather size={ 14 } className="panel-title-icon" />
                        <span>Publish a dispatch</span>
                    </div>
                    <div className="panel panel-darker news-admin-compose">
                        <form onSubmit={ onSubmit }>
                            <textarea
                                className="news-admin-textarea"
                                placeholder={ "Compose the next dispatch. URLs auto-linkify; line breaks are kept. Markup: <b>, <i>, <em>, <strong>, <br>." }
                                value={ newsText }
                                onChange={ onNewsTextChange }
                                rows={ 6 }
                            />
                            <div className="news-admin-actions">
                                <span className="news-admin-hint">
                                    { newsText.length > 0 ? `${newsText.length} character${newsText.length === 1 ? "" : "s"}` : "" }
                                </span>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={ !canSubmit }
                                >
                                    Publish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="col-sm-5">
                    <div className="panel-title">
                        <ScrollText size={ 14 } className="panel-title-icon" />
                        <span>Recent dispatches</span>
                    </div>
                    <div className="panel panel-darker news-admin-list-panel">
                        { loading ? (
                            <div className="news-admin-empty">Unfurling the scroll&hellip;</div>
                        ) : !news || news.length === 0 ? (
                            <div className="news-admin-empty">No dispatches yet.</div>
                        ) : (
                            <ol className="news-admin-list">
                                { news.map((item: NewsItem, index: number) => {
                                    const date = item.datePublished ? new Date(item.datePublished) : null;
                                    return (
                                        <li key={ index } className="news-admin-list-item">
                                            <div className="news-admin-item-meta">
                                                <span className="news-admin-item-day">{ date ? format(date, "dd") : "--" }</span>
                                                <span className="news-admin-item-monthyear">
                                                    <span>{ date ? format(date, "MMM").toUpperCase() : "" }</span>
                                                    <span>{ date ? format(date, "yyyy") : "" }</span>
                                                </span>
                                            </div>
                                            <div className="news-admin-item-body">
                                                <div className="news-admin-item-text">{ item.text }</div>
                                                <div className="news-admin-item-poster">{ item.poster }</div>
                                            </div>
                                        </li>
                                    );
                                }) }
                            </ol>
                        ) }
                    </div>
                </div>
            </div>
        </div>
    );
}

InnerNewsAdmin.displayName = "NewsAdmin";

function mapStateToProps(state: RootState) {
    return {
        apiError: state.api.message,
        loading: state.news.loading,
        news: state.news.news,
        newsSaved: state.news.newsSaved
    };
}

export default function NewsAdmin() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    const merged = { ...props, ...boundActions } as InnerNewsAdminProps;
    return <InnerNewsAdmin { ...merged } />;
}
