import React, { useEffect, useMemo, useState } from "react";
import { shallowEqual } from "react-redux";
import { bindActionCreators } from "@reduxjs/toolkit";
import { format } from "date-fns";

import AlertPanel from "./SiteComponents/AlertPanel";

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

export function InnerGameErrorsAdmin({ apiError, current, errors, loadGameErrors, loadGameError, resolveGameError, loading }: InnerGameErrorsAdminProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

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

    return (
        <div className="game-errors-admin">
            { apiError ? <AlertPanel type="error" message={ apiError } /> : null }

            <h3>Game Errors</h3>

            { loading ? (
                <div>Loading game errors&hellip;</div>
            ) : !errors || errors.length === 0 ? (
                <div>No game errors recorded.</div>
            ) : (
                <table className="table table-condensed">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Kind</th>
                            <th>Players</th>
                            <th>Error</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        { errors.map((item: GameErrorSummary) => {
                            const ts = item.timestamp ? new Date(item.timestamp) : null;
                            const isExpanded = expandedId === item._id;
                            const showCurrent = isExpanded && current && current._id === item._id;
                            const kind = item.kind || "server";
                            const count = item.count && item.count > 1 ? ` (×${item.count})` : "";
                            return (
                                <React.Fragment key={ item._id }>
                                    <tr>
                                        <td>{ ts ? format(ts, "yyyy-MM-dd HH:mm:ss") : "" }</td>
                                        <td><span className="label label-default">{ kind }</span>{ count }</td>
                                        <td>{ Array.isArray(item.players) ? item.players.join(" vs ") : "" }</td>
                                        <td className="game-errors-message" title={ item.errorMessage }>{ item.errorMessage }</td>
                                        <td>
                                            <button type="button" className="btn btn-default btn-xs" onClick={ () => onToggle(item._id) }>
                                                { isExpanded ? "Hide" : "View JSON" }
                                            </button>
                                            <button type="button" className="btn btn-default btn-xs" onClick={ () => onDownload(item._id) }>
                                                Download
                                            </button>
                                            <button type="button" className="btn btn-default btn-xs" onClick={ () => resolveGameError(item._id) }>
                                                Resolved
                                            </button>
                                        </td>
                                    </tr>
                                    { isExpanded ? (
                                        <tr>
                                            <td colSpan={ 5 }>
                                                { showCurrent ? (
                                                    <pre className="game-errors-json">{ JSON.stringify(current!.debugData, null, 2) }</pre>
                                                ) : (
                                                    <div>Loading&hellip;</div>
                                                ) }
                                            </td>
                                        </tr>
                                    ) : null }
                                </React.Fragment>
                            );
                        }) }
                    </tbody>
                </table>
            ) }
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
