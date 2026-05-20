import React, { useState, useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { format } from "date-fns";

import AlertPanel from "./SiteComponents/AlertPanel";
import TextArea from "./FormComponents/TextArea";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState } from "./types/redux";

interface NewsItem {
    datePublished: string;
    poster: string;
    text: string;
    _id?: string;
}

interface InnerNewsAdminProps {
    addNews: (text: string) => any;
    apiError?: string;
    clearNewsStatus: () => any;
    loadNews: (opts: { forceLoad: boolean }) => any;
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

    const onAddNews = (event: React.MouseEvent) => {
        event.preventDefault();
        addNews(newsText);
        setNewsText("");
    };

    let content = null;

    const renderedNews = news?.map((newsItem: NewsItem, index: number) => (
        <tr key={ index }>
            <td>{ format(new Date(newsItem.datePublished), "yyyy-MM-dd") }</td>
            <td>{ newsItem.poster }</td>
            <td>{ newsItem.text }</td>
        </tr>
    ));

    let successPanel = null;

    if(newsSaved) {
        successPanel = (
            <AlertPanel message="News added successfully" type="success" />
        );
    }

    if(loading) {
        content = <div>Loading news from the server...</div>;
    } else if(apiError) {
        content = <AlertPanel type="error" message={ apiError } />;
    } else {
        content = (
            <div>
                { successPanel }
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Poster</th>
                            <th>Text</th>
                        </tr>
                    </thead>
                    <tbody>
                        { renderedNews }
                    </tbody>
                </table>

                <form className="form">
                    <TextArea name="newsText" label="Add news item" value={ newsText } onChange={ onNewsTextChange } />

                    <button type="submit" className="btn btn-primary" onClick={ onAddNews }>Add</button>
                </form>
            </div>
        );
    }

    return content;
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
    return <InnerNewsAdmin { ...props } { ...boundActions } />;
}
