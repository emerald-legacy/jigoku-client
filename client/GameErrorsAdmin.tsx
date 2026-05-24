import React, { useEffect, useMemo, useState } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { format } from "date-fns";
import {
    ServerCog,
    Atom,
    Globe,
    Zap,
    Eye,
    EyeOff,
    Download,
    Check,
    Users
} from "lucide-react";

import AlertPanel from "./SiteComponents/AlertPanel";
import JsonTree from "./SiteComponents/JsonTree";

import * as actions from "./actions";
import { useAppSelector, useAppDispatch } from "./hooks";
import type { RootState, GameErrorSummary, GameErrorRecord } from "./types/redux";

interface InnerGameErrorsAdminProps {
    apiError?: string;
    current?: GameErrorRecord;
    errors?: GameErrorSummary[];
    loadGameErrors: (opts: { forceLoad: boolean }) => void;
    loadGameError: (id: string) => void;
    resolveGameError: (id: string) => void;
    loading?: boolean;
}

type KindKey = "server" | "react" | "window" | "unhandledRejection";

const KIND_META: Record<KindKey, { label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    server: { label: "Server", Icon: ServerCog },
    react: { label: "React", Icon: Atom },
    window: { label: "Window", Icon: Globe },
    unhandledRejection: { label: "Promise", Icon: Zap }
};

function resolveKind(raw?: string): KindKey {
    if(raw === "react" || raw === "window" || raw === "unhandledRejection") {
        return raw;
    }
    return "server";
}

function downloadJson(error: GameErrorRecord) {
    const blob = new Blob([JSON.stringify(error, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `game-error-${error._id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

interface KindFilterProps {
    counts: Record<KindKey, number>;
    total: number;
    selected: KindKey | "all";
    onChange: (kind: KindKey | "all") => void;
}

function KindFilter({ counts, total, selected, onChange }: KindFilterProps) {
    const kinds: KindKey[] = ["server", "react", "window", "unhandledRejection"];
    return (
        <div className="errors-filter-bar">
            <button
                type="button"
                className={ `errors-filter-chip ${selected === "all" ? "is-active" : ""}` }
                onClick={ () => onChange("all") }
            >
                <span className="errors-filter-label">All</span>
                <span className="errors-filter-count">{ total }</span>
            </button>
            { kinds.map(k => {
                const { label, Icon } = KIND_META[k];
                const c = counts[k] || 0;
                return (
                    <button
                        key={ k }
                        type="button"
                        className={ `errors-filter-chip errors-filter-chip-${k} ${selected === k ? "is-active" : ""} ${c === 0 ? "is-empty" : ""}` }
                        onClick={ () => onChange(k) }
                        disabled={ c === 0 && selected !== k }
                    >
                        <Icon size={ 13 } className="errors-filter-icon" />
                        <span className="errors-filter-label">{ label }</span>
                        <span className="errors-filter-count">{ c }</span>
                    </button>
                );
            }) }
        </div>
    );
}

export function InnerGameErrorsAdmin({ apiError, current, errors, loadGameErrors, loadGameError, resolveGameError, loading }: InnerGameErrorsAdminProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<KindKey | "all">("all");

    useEffect(() => {
        loadGameErrors({ forceLoad: true });
    }, [loadGameErrors]);

    const onToggle = (id: string) => {
        if(expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        loadGameError(id);
    };

    const onDownload = (id: string) => {
        if(current && current._id === id) {
            downloadJson(current);
            return;
        }
        loadGameError(id);
    };

    const { kindCounts, total } = useMemo(() => {
        const c: Record<KindKey, number> = { server: 0, react: 0, window: 0, unhandledRejection: 0 };
        let t = 0;
        for(const e of errors || []) {
            c[resolveKind(e.kind)] += 1;
            t += 1;
        }
        return { kindCounts: c, total: t };
    }, [errors]);

    const visible = useMemo(() => {
        if(!errors) {
            return [];
        }
        if(filter === "all") {
            return errors;
        }
        return errors.filter(e => resolveKind(e.kind) === filter);
    }, [errors, filter]);

    return (
        <div className="errors-admin">
            { apiError ? <AlertPanel type="error" message={ apiError } /> : null }

            <KindFilter counts={ kindCounts } total={ total } selected={ filter } onChange={ setFilter } />

            <div className="panel panel-darker errors-list-panel">
                { loading ? (
                    <div className="errors-list-empty">Loading game errors&hellip;</div>
                ) : visible.length === 0 ? (
                    <div className="errors-list-empty">
                        { total === 0 ? "No errors recorded." : "No errors match this filter." }
                    </div>
                ) : (
                    <ul className="errors-list">
                        <li className="errors-row errors-row-head">
                            <div className="errors-row-main">
                                <div className="errors-col errors-col-time">Time</div>
                                <div className="errors-col errors-col-kind">Kind</div>
                                <div className="errors-col errors-col-players">Players</div>
                                <div className="errors-col errors-col-message">Error</div>
                                <div className="errors-col errors-col-actions" aria-hidden="true" />
                            </div>
                        </li>
                        { visible.map((item: GameErrorSummary) => {
                            const ts = item.timestamp ? new Date(item.timestamp) : null;
                            const isExpanded = expandedId === item._id;
                            const showCurrent = isExpanded && current && current._id === item._id;
                            const kind = resolveKind(item.kind);
                            const { Icon: KindIcon, label: kindLabel } = KIND_META[kind];
                            const count = item.count && item.count > 1 ? item.count : null;

                            return (
                                <li key={ item._id } className={ `errors-row errors-row-kind-${kind} ${isExpanded ? "is-expanded" : ""}` }>
                                    <div className="errors-row-main">
                                        <div className="errors-col errors-col-time">
                                            <span className="errors-time-date">{ ts ? format(ts, "yyyy-MM-dd") : "—" }</span>
                                            <span className="errors-time-clock">{ ts ? format(ts, "HH:mm:ss") : "" }</span>
                                        </div>

                                        <div className="errors-col errors-col-kind">
                                            <span className={ `errors-kind-tag errors-kind-tag-${kind}` }>
                                                <KindIcon size={ 13 } className="errors-kind-icon" />
                                                <span className="errors-kind-label">{ kindLabel }</span>
                                            </span>
                                            { count ? <span className="errors-kind-count">×{ count }</span> : null }
                                        </div>

                                        <div className="errors-col errors-col-players">
                                            { item.players && item.players.length > 0 ? (
                                                <>
                                                    <Users size={ 12 } className="errors-players-icon" />
                                                    <span className="errors-players-text">{ item.players.join(" vs ") }</span>
                                                </>
                                            ) : (
                                                <span className="errors-players-empty">—</span>
                                            ) }
                                        </div>

                                        <div className="errors-col errors-col-message" title={ item.errorMessage }>
                                            <span className="errors-message-text">{ item.errorMessage }</span>
                                        </div>

                                        <div className="errors-col errors-col-actions">
                                            <button
                                                type="button"
                                                className={ `errors-action ${isExpanded ? "is-active" : ""}` }
                                                onClick={ () => onToggle(item._id) }
                                                title={ isExpanded ? "Hide details" : "View details" }
                                                aria-label={ isExpanded ? "Hide details" : "View details" }
                                            >
                                                { isExpanded ? <EyeOff size={ 14 } /> : <Eye size={ 14 } /> }
                                            </button>
                                            <button
                                                type="button"
                                                className="errors-action"
                                                onClick={ () => onDownload(item._id) }
                                                title="Download JSON"
                                                aria-label="Download JSON"
                                            >
                                                <Download size={ 14 } />
                                            </button>
                                            <button
                                                type="button"
                                                className="errors-action errors-action-resolve"
                                                onClick={ () => resolveGameError(item._id) }
                                                title="Mark as resolved"
                                                aria-label="Mark as resolved"
                                            >
                                                <Check size={ 14 } />
                                            </button>
                                        </div>
                                    </div>

                                    { isExpanded ? (
                                        <div className="errors-row-expanded">
                                            { showCurrent ? (
                                                <>
                                                    { current!.errorStack ? (
                                                        <section className="errors-detail-section">
                                                            <div className="errors-detail-label">Stack</div>
                                                            <pre className="errors-detail-stack">{ current!.errorStack }</pre>
                                                        </section>
                                                    ) : null }
                                                    <section className="errors-detail-section">
                                                        <div className="errors-detail-label">Debug payload</div>
                                                        <div className="errors-detail-json">
                                                            <JsonTree data={ current!.debugData } initialDepth={ 2 } />
                                                        </div>
                                                    </section>
                                                </>
                                            ) : (
                                                <div className="errors-detail-loading">Loading&hellip;</div>
                                            ) }
                                        </div>
                                    ) : null }
                                </li>
                            );
                        }) }
                    </ul>
                ) }
            </div>
        </div>
    );
}

InnerGameErrorsAdmin.displayName = "GameErrorsAdmin";

function mapStateToProps(state: RootState) {
    return {
        apiError: state.api.message,
        current: state.gameErrors.current,
        errors: state.gameErrors.errors,
        loading: state.gameErrors.loading
    };
}

export default function GameErrorsAdmin() {
    const props = useAppSelector(mapStateToProps, shallowEqual);
    const dispatch = useAppDispatch();
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
    const merged = { ...props, ...boundActions } as InnerGameErrorsAdminProps;
    return <InnerGameErrorsAdmin { ...merged } />;
}
