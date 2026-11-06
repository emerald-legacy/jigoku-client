import React from "react";
import type { ReactNode, ErrorInfo } from "react";
import { http } from "../http";

interface ErrorBoundaryProps {
    children: ReactNode;
    errorPath?: string;
    message?: string;
    navigate?: (path: string) => void | Promise<void>;
}

interface ErrorBoundaryState {
    error: Error | null;
    errorPath?: string;
}

function isStaleChunkError(error: Error): boolean {
    const msg = (error?.message || "").toLowerCase();
    return (
        error?.name === "ChunkLoadError" ||
        msg.includes("failed to fetch dynamically imported module") ||
        msg.includes("error loading dynamically imported module") ||
        msg.includes("importing a module script failed")
    );
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    static displayName = "ErrorBoundary";

    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.state = {
            error: null,
            errorPath: props.errorPath
        };

        this.onReturnClick = this.onReturnClick.bind(this);
        this.onReloadClick = this.onReloadClick.bind(this);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        if(this.props.errorPath !== prevProps.errorPath) {
            this.setState({ error: null, errorPath: this.props.errorPath });
        }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.setState({ error });

        if(isStaleChunkError(error)) {
            return;
        }

        console.error("React Error Boundary caught an error:", error, info);

        http.post("/api/admin/game-errors/client", {
            errorMessage: error.message,
            errorStack: error.stack,
            componentStack: info.componentStack,
            kind: "react",
            url: window.location.href,
            userAgent: navigator.userAgent
        }).catch(() => {});
    }

    onReturnClick(event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.setState({error: null});
        this.props.navigate?.("/");
    }

    onReloadClick(event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        window.location.reload();
    }

    render() {
        if(this.state.error) {
            if(isStaleChunkError(this.state.error)) {
                return (
                    <div className="alert alert-info">
                        <p>A new version of Jigoku is available.</p>
                        <div className="error-actions">
                            <button type="button" className="btn btn-primary" onClick={ this.onReloadClick }>Reload to update</button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="alert alert-danger">
                    <p>{ this.props.message }</p>
                    <p>The error has been logged.</p>
                    <div className="error-actions">
                        <button type="button" className="btn btn-primary" onClick={ this.onReloadClick }>Reload page</button>
                        { this.props.navigate &&
                            <button type="button" className="btn btn-quiet" onClick={ this.onReturnClick }>Back to the lobby</button> }
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
