import React from "react";
import type { ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    errorPath?: string;
    message?: string;
    navigate?: (path: string) => void;
}

interface ErrorBoundaryState {
    error: Error | null;
    errorPath?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.state = {
            error: null,
            errorPath: props.errorPath
        };

        this.onReturnClick = this.onReturnClick.bind(this);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        if(this.props.errorPath !== prevProps.errorPath) {
            this.setState({ error: null, errorPath: this.props.errorPath });
        }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.setState({ error });
        console.error("React Error Boundary caught an error:", error, info);
    }

    onReturnClick(event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.setState({error: null});
        this.props.navigate?.("/");
    }

    render() {
        if(this.state.error) {
            return (
                <div className="alert alert-danger">
                    <p>{ this.props.message }</p>
                    <p>An error has been logged. Please try refreshing the page.</p>

                    { this.props.navigate &&
                        <p>Click <a href="#" onClick={ this.onReturnClick }>here</a> to clear the error and return to the home page</p> }
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.displayName = "ErrorBoundary";

export default ErrorBoundary;
